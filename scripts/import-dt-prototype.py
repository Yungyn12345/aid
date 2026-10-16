"""Import the supplied form markup; never execute its embedded JavaScript."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

class Node:
    def __init__(self,tag,attrs=(),parent=None,line=0):
        self.tag,self.attrs,self.parent,self.line=tag,dict(attrs),parent,line
        self.children=[]
    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child,Node): yield from child.walk()
    def has(self,name): return name in self.attrs.get('class','').split()
    def text(self): return ''.join(c.text() if isinstance(c,Node) else c for c in self.children)
    def find(self,p): return next((n for n in self.walk() if p(n)),None)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root=self.current=Node('root')
    def handle_starttag(self,tag,attrs):
        node=Node(tag,attrs,self.current,self.getpos()[0]); self.current.children.append(node)
        if tag not in {'input','br','hr','img','meta','link','source','wbr','area','base','embed','param','col'}: self.current=node
    def handle_endtag(self,tag):
        node=self.current
        while node.parent:
            if node.tag==tag: self.current=node.parent; return
            node=node.parent
    def handle_data(self,data): self.current.children.append(data)

source=Path(sys.argv[1]).read_text()
parser=Parser(); parser.feed(source)
root=Path(__file__).resolve().parents[1]
board=parser.root.find(lambda n:n.has('board'))
clean=lambda text:re.sub(r'\s+',' ',text).strip()
aliases={
'4':['g4-lists'],'7':['g7-reference'],'9':['g9-party'],'10':['g10-unused'],
'11':['g11-trade','g11-unused'],'12':['g12-total'],'13':['g13-special'],
'18':['g18-vehicle','g18-country'],'21':['g21-vehicle','g21-country'],'23':['g23-rate'],
'24':['g24-code','g24-feature','g24-unused'],'26':['g26-mode'],'27':['g27-unused'],
'28':['g28-unused'],'30':['g30-location'],'33':['g33-tnved','g33-intellectual','g33-additional'],
'36':['g36-preference'],'37':['g37-procedure','g37-movement'],'39':['g39-quota'],
'40':['g40-previous'],'41':['g41-unit','g41-quantity'],'42':['g42-amount'],
'43':['g43-method'],'44':['g44-documents'],'46':['g46-statistical'],
'47':['g47-payments'],'48':['g48-deferral'],'B':['gB-payments'],
'49':['g49-warehouse'],'51':['g51-transit'],'53':['g53-destination'],
}
names54=[['g54-certificate-number','g54-certificate-date'],['g54-inn'],
['g54-contract-number','g54-contract-date'],['g54-surname','g54-firstname','g54-patronymic'],
['g54-phone'],['g54-position'],['g54-identity-code','g54-identity-name','g54-identity-series','g54-identity-number','g54-identity-date'],
['g54-identity-issuer'],['g54-authority-name','g54-authority-number','g54-authority-from','g54-authority-to'],
['g54-print'],['g54-place'],['g54-submitted'],['g54-registered'],['g54-act']]
fields=[]; bynode={}; controls={}; used=set(); n54=0
for node in board.walk():
    if not node.has('field'): continue
    graph=node.attrs['data-graph']; labelnode=node.find(lambda n:n.has('f-name'))
    label=clean(labelnode.text()) if labelnode else ''
    links=[{'label':node.attrs.get(f'data-{k}-label','Классификатор'),'url':node.attrs[f'data-{k}-url']} for k in ['cl','cl2','cl3','cl4'] if f'data-{k}-url' in node.attrs]
    field={'id':f'field-{len(fields)+1}','graph':graph,'label':label,'required':node.has('required'),
           'rule':node.attrs.get('data-rule',''),'related':node.attrs.get('data-related',''),'links':links,'controls':[]}
    candidates=names54[n54] if graph=='54' else aliases.get(graph,[])
    if graph=='54': n54+=1
    for j,c in enumerate(n for n in node.walk() if n.tag in {'input','textarea'}):
        key=c.attrs.get('id') or (candidates[j] if j<len(candidates) else None)
        if not key or key in used: raise ValueError((graph,label,j,key))
        used.add(key)
        data={'key':key,'type':'textarea' if c.tag=='textarea' else 'text','placeholder':c.attrs.get('placeholder',''),
              'disabled':'disabled' in c.attrs,'className':c.attrs.get('class',''),'rows':int(c.attrs.get('rows','2')),
              'goods':graph.isdigit() and 31<=int(graph)<=48}
        controls[c]=data; field['controls'].append(data)
    fields.append(field); bynode[node]=field
for c in board.walk():
    if c.tag=='input' and c.attrs.get('type')=='checkbox':
        controls[c]={'key':c.attrs['id'],'type':'checkbox','disabled':False,'goods':False}

sections=[]
for n in board.walk():
    if n.has('card'):
        header=n.find(lambda c:c.tag=='h2')
        sections.append({'id':f'section-{len(sections)+1}','title':clean(header.text()),'fields':[bynode[f]['id'] for f in n.walk() if f in bynode]})
schema='''// Imported from the user supplied DT prototype. Source-map UI is intentionally omitted.
export type DeclarationControl = { key: string; type: string; placeholder?: string; disabled: boolean; className?: string; rows?: number; goods: boolean }
export type DeclarationField = { id: string; graph: string; label: string; required: boolean; rule: string; related: string; links: Array<{ label: string; url: string }>; controls: DeclarationControl[] }
export type DeclarationSection = { id: string; title: string; fields: string[] }
'''
schema+='export const declarationFields: DeclarationField[] = '+json.dumps(fields,ensure_ascii=False,indent=2)+'\n'
schema+='export const declarationSections: DeclarationSection[] = '+json.dumps(sections,ensure_ascii=False,indent=2)+'\n'
schema+='export const checkboxControls = '+json.dumps([v for v in controls.values() if v['type']=='checkbox'],ensure_ascii=False,indent=2)+' as const\n'
schema+='export const goodsControlKeys = new Set(declarationFields.flatMap(field => field.controls.filter(control => control.goods).map(control => control.key)))\n'
schema+='export const allDeclarationControls = [...declarationFields.flatMap(field => field.controls), ...checkboxControls]\n'
(root/'shared/aideclarant').mkdir(parents=True,exist_ok=True)
(root/'shared/aideclarant/schema.ts').write_text(schema)

from html import escape
def render(node,goods=False):
    if isinstance(node,str): return node
    if node.has('src-chip'): return ''
    if node.has('field'):
        field=bynode[node]
        attrs={k:v for k,v in node.attrs.items() if k in ('class','style')}
        attrs['data-field-group']=field['id']
        if field['graph']=='B' and goods: attrs['v-if']='goodsIndex === 0'
    else: attrs=dict(node.attrs)
    if goods and 'id' in attrs:
        old_id=attrs.pop('id'); attrs[':id']=f"'{old_id}-' + goodsIndex"
    if node.tag=='button' and node.has('info'):
        field=node.parent
        while field and field not in bynode: field=field.parent
        attrs['type']='button'; attrs['@click']=f"activeInfo = '{bynode[field]['id']}'"
        attrs['aria-label']='Правило заполнения: '+bynode[field]['label']
    if node.tag=='a' and node.has('link'):
        field=node.parent
        while field and field not in bynode: field=field.parent
        link=field.attrs.get('data-cl-url') if field else None
        if not link: return ''
        attrs['href']=link; attrs['rel']='noopener noreferrer'; attrs['aria-label']='Открыть классификатор'
    if node in controls:
        c=controls[node]; key=c['key']; index='goodsIndex' if c['goods'] else '0'
        attrs.pop('id',None); attrs.pop('disabled',None)
        attrs[':id']=f"inputId('{key}', {index})"; attrs['data-field']=key
        attrs[':data-goods-index']=index if c['goods'] else None
        attrs['aria-label']=(bynode[next(n for n in bynode if node in list(n.walk()))]['label']+' — '+c.get('placeholder','')).strip(' —') if c['type']!='checkbox' else ('Отправитель: ' if key.startswith('g2') else 'Получатель: ')+('СМ. ГРАФУ 14 ДТ' if key.endswith('same') else 'КОНТРАГЕНТ')
        attrs[':disabled']=f"isDisabled('{key}')"
        if c['type']=='checkbox': attrs[':checked']=f"value('{key}') === 'true'"; attrs['@change']=f"changeCheckbox('{key}', $event)"
        else:
            attrs[':value']=f"value('{key}', {index})"; attrs['@input']=f"changeValue('{key}', $event, {index})"
            if key=='g54-print': attrs[':readonly']='true'
    attrs={k:v for k,v in attrs.items() if v is not None}
    attrtext=''.join(' '+k+'="'+(str(v) if k.startswith((':','@','v-')) else escape(str(v),quote=True))+'"' for k,v in attrs.items())
    if node.tag in ParserVoid: return '<'+node.tag+attrtext+'>'
    children=''.join(render(c,goods) for c in node.children)
    if node.tag=='textarea': children=''
    return '<'+node.tag+attrtext+'>'+children+'</'+node.tag+'>'
ParserVoid={'input','br','hr','img','meta','link','source','wbr','area','base','embed','param','col'}
parts=[]
for child in board.children:
    if isinstance(child,Node) and child.has('card') and any(f in bynode and bynode[f]['graph']=='31' for f in child.walk()):
        card=render(child,True)
        card=card.replace('<section ', '<section v-for="goodsIndex in goodsIndices" :key="goodsIndex" ',1)
        card=card.replace('</h2>', ' <span v-if="goodsCount > 1">{{ goodsIndex + 1 }}</span></h2>',1)
        card=card.replace('<div class="card-body">','<div class="goods-actions"><button type="button" @click="addGoods">Добавить товар</button><button v-if="goodsCount > 1" type="button" @click="removeGoods(goodsIndex)">Удалить этот товар</button></div><div class="card-body">',1)
        parts.append(card)
    else: parts.append(render(child))
markup=''.join(parts)
css=source.split('<style>',1)[1].split('</style>',1)[0]
# Preserve the prototype font import; selector rewriting must not touch class names.
css=css.replace(':root{','.dt-prototype{')
css=re.sub(r'(?m)^(\s*)body\s*\{',r'\1.dt-prototype{',css)
css='\n'.join(line for line in css.splitlines() if not any(t in line for t in ['body.mode-source','data-source','.legend','.src-chip','.mode-switch','.mode-note','.drawer','.overlay','.fmt-switch','.xml-btn','.topbar','.pop','.spacer','.dl-btn']))
css+='''
.dt-prototype{font-weight:400;line-height:normal;text-align:left;letter-spacing:normal;border-radius:10px;overflow:hidden;}
.dt-prototype{width:100%;border-radius:0;overflow:visible;}
.dt-prototype .field input{line-height:normal;}
.dt-prototype .board{padding:20px 24px 90px;}
.form-head{position:sticky;top:0;z-index:40;background:var(--accent-ink);color:white;}
.form-head::before{content:"";display:block;height:4px;background:linear-gradient(90deg,#2452C8,#5C8DFF);}
.form-head-inner{max-width:1480px;margin:0 auto;padding:14px 24px;}
.form-head h1{margin:0;font-size:15px;font-weight:700;line-height:normal;}
.form-head small{display:block;font-weight:400;font-size:11.5px;color:#AEBBDE;margin-top:2px;}
.form-head p{max-width:1480px;margin:0 auto;padding:0 24px 14px;font-size:12.5px;color:#AEBBDE;line-height:1.5;}
.goods-actions{display:flex;gap:8px;padding:10px 18px 0;}
.goods-actions button{border:1px solid var(--line);background:white;color:var(--accent-ink);padding:7px 12px;border-radius:6px;cursor:pointer;}
.info-backdrop{position:fixed;inset:0;background:#10203c66;z-index:1000;display:grid;place-items:center;padding:20px;}
.info-panel{position:relative;max-height:80vh;overflow:auto;max-width:520px;padding:24px;background:white;color:var(--ink);border-radius:10px;font-size:13px;}
.info-panel h3{margin:0 30px 12px 0;}.info-panel p{line-height:1.6;}.info-panel a{color:var(--accent);}
.info-close{position:absolute;top:10px;right:12px;border:0;background:none;font-size:22px;cursor:pointer;}
'''
script='''<script setup lang="ts">
import { declarationFields } from '#shared/aideclarant/schema'
import { draftValue, updateDraftValue, resizeGoods, removeGoodsAt } from '#shared/aideclarant/declaration'
import type { DeclarationDraft } from '#shared/aideclarant/types'
const props = defineProps<{ modelValue: DeclarationDraft }>()
const emit = defineEmits<{ 'update:modelValue': [value: DeclarationDraft] }>()
const activeInfo = ref('')
const info = computed(() => declarationFields.find(field => field.id === activeInfo.value))
const goodsCount = computed(() => Math.max(1, Number(props.modelValue.goodsCount) || 1))
const goodsIndices = computed(() => Array.from({ length: goodsCount.value }, (_, index) => index))
const inputId = (key: string, index = 0) => `dt-${key}-${index}`
const value = (key: string, index = 0) => draftValue(props.modelValue, key, index)
const isDisabled = (key: string) => declarationFields.some(field => field.controls.some(control => control.key === key && control.disabled)) || (/^g[28]-(name|addr|ogrn|inn)$/.test(key) && props.modelValue[`${key.slice(0, 2)}-same`] === 'true')
const changeValue = (key: string, event: Event, index = 0) => emit('update:modelValue', updateDraftValue(props.modelValue, key, (event.target as HTMLInputElement).value, index))
const changeCheckbox = (key: string, event: Event) => emit('update:modelValue', updateDraftValue(props.modelValue, key, (event.target as HTMLInputElement).checked ? 'true' : 'false'))
const addGoods = () => emit('update:modelValue', resizeGoods(props.modelValue, goodsCount.value + 1))
const removeGoods = (index: number) => emit('update:modelValue', removeGoodsAt(props.modelValue, index))
</script>
'''
template='''\n<template><div class="dt-prototype"><div class="form-head"><div class="form-head-inner"><h1>Декларация на товары (ДТ)</h1><small>Поля расположены в порядке официального документа · Решение КТС № 257</small></div><p>Значок ⓘ — правило заполнения графы, связь с другими графами и ссылка на страницу с разбором этой графы на alta.ru. Значок ⌘ — ссылка сразу на нужное приложение (классификатор). Розовая заливка — обязательные поля, серые неактивные — графы, которые декларант не заполняет.</p></div>
<div class="board">'''+markup+'''</div>
<div v-if="info" class="info-backdrop" @click.self="activeInfo = ''" @keydown.esc="activeInfo = ''"><section class="info-panel" role="dialog" aria-modal="true" aria-labelledby="dt-info-title"><button class="info-close" type="button" aria-label="Закрыть правило" @click="activeInfo = ''">×</button><h3 id="dt-info-title">Графа {{ info.graph }} · {{ info.label }}</h3><p>{{ info.rule }}</p><p v-if="info.related">{{ info.related }}</p><p v-for="link in info.links" :key="link.url"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a></p></section></div>
</div></template>
'''
(root/'app/components').mkdir(parents=True,exist_ok=True)
(root/'app/components/DtDeclarationForm.vue').write_text(script+template+'\n<style scoped>\n'+css+'\n</style>\n')
print(f'Imported {len(fields)} field groups, {len(controls)} controls, {len(sections)} sections')
