import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type TypstInputValue = string | number | boolean | null | undefined

type CompileTypstPdfParams = {
  templatePath: string
  outputName?: string
  data: Record<string, TypstInputValue>
}

const normalizeTypstBinaryCandidates = () => {
  return [
    process.env.TYPST_BIN,
    process.env.TYPST_BINARY,
    process.env.TYPST_PATH,
    'typst',
  ].filter((item): item is string => Boolean(item && item.trim()))
}

export const findTypstBinary = async () => {
  const errors: string[] = []

  for (const candidate of normalizeTypstBinaryCandidates()) {
    try {
      await execFileAsync(candidate, ['--version'])
      return candidate
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${candidate}: ${message}`)
    }
  }

  throw new Error(`Typst binary not found. Install typst or set TYPST_BIN. Tried: ${errors.join(' | ')}`)
}

const stringifyDataValue = (value: TypstInputValue) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

const compileWithTypstCli = async (typstBin: string, inputTyp: string, outputPdf: string, cwd: string) => {
  try {
    await execFileAsync(typstBin, ['compile', '--input', 'data=declaration-data.json', inputTyp, outputPdf], {
      cwd,
      maxBuffer: 1024 * 1024 * 10,
    })
  } catch (error) {
    const stderr = typeof error === 'object' && error && 'stderr' in error
      ? String((error as { stderr?: unknown }).stderr || '')
      : ''
    const stdout = typeof error === 'object' && error && 'stdout' in error
      ? String((error as { stdout?: unknown }).stdout || '')
      : ''
    const message = error instanceof Error ? error.message : String(error)

    throw new Error([message, stderr, stdout].filter(Boolean).join('\n'))
  }
}

export const compileTypstPdf = async (params: CompileTypstPdfParams) => {
  const typstBin = await findTypstBinary()
  const workDir = await mkdtemp(join(tmpdir(), 'aidoc-typst-'))

  try {
    const inputTyp = join(workDir, 'declaration.typ')
    const outputPdf = join(workDir, params.outputName || `declaration-${randomUUID()}.pdf`)
    const dataPath = join(workDir, 'declaration-data.json')
    const template = await readFile(params.templatePath, 'utf8')

    const data = Object.fromEntries(
      Object.entries(params.data).map(([key, value]) => [key, stringifyDataValue(value)]),
    )

    await writeFile(inputTyp, template, 'utf8')
    await writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8')
    await compileWithTypstCli(typstBin, inputTyp, outputPdf, dirname(inputTyp))

    return await readFile(outputPdf)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}
