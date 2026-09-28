# Builds app/src/data/coroner.json from the frozen eval runs + their session transcripts (local only).
import json,glob,os,sys,re
R=sys.argv[1]; E=f'{R}/agent/eval'
import yaml
Q={q['id']:q for q in yaml.safe_load(open(f'{E}/questions.yaml'))}
# Session transcripts live in the agent CLI's own folder; point TRANSCRIPTS_GLOB at it (e.g. '<config dir>/projects/*').
idx={os.path.basename(j)[:-6]:j for r in glob.glob(os.path.expanduser(os.environ['TRANSCRIPTS_GLOB'])) for j in glob.glob(r+'/*.jsonl')}
# Model ids are mapped to neutral labels (MODEL_LABELS='id=label,id=label'); the posts name the models.
LABELS=dict(x.split('=',1) for x in os.environ.get('MODEL_LABELS','').split(',') if '=' in x)
def load_grades(d):
    p=f'{d}/grades.json'
    return {(g['id'],g['cond']):g for g in json.load(open(p))} if os.path.exists(p) else {}
def trace(sid):
    calls=[];model=None;res={}
    if sid not in idx: return calls,model
    for line in open(idx[sid]):
        e=json.loads(line); m=e.get('message') or {}
        if not isinstance(m,dict): continue
        model=model or m.get('model')
        for c in m.get('content') or [] if isinstance(m.get('content'),list) else []:
            if c.get('type')=='tool_use':
                name=c['name'].split('__')[-1]; server=c['name'].split('__')[1] if c['name'].count('__')>=2 else ''
                calls.append({'id':c['id'],'server':server.replace('sanity-',''),'tool':name,'input':c.get('input',{})})
            if c.get('type')=='tool_result':
                t=c.get('content'); t=''.join(x.get('text','') for x in t) if isinstance(t,list) else str(t)
                res[c.get('tool_use_id')]=len(t)
    for c in calls: c['resultChars']=res.get(c.pop('id'),0)
    return calls,model
AFTER_FIX={'q04':'The dataset had no mapping from empty-string-equals-NULL to Oracle Database@Azure. The mapping was added and the question re-run.','q13':'With the Knowledge Base available, the agent read prose instead of the dispute documents. A rule was added: query disputes before reading Knowledge Base prose. Both Sanity conditions were re-run; the baselines are the frozen runs.'}
out={'frozen':'2026-09-27','graderModel':LABELS.get(os.environ.get('GRADER_MODEL_ID',''),'larger model'),'questions':[]}
runs={}
for d,tag in [(f'{E}/results/2026-09-27','frozen'),(f'{E}/results/2026-09-27-q04-after-fix','afterFix'),(f'{E}/results/2026-09-27-q13-after-fix','afterFix'),(f'{E}/results/2026-09-27-additions','added')]:
    G=load_grades(d)
    for f in sorted(glob.glob(f'{d}/q*.json')):
        o=json.load(open(f)); m=o['meta']; qid,cond=m['id'],m['cond']
        calls,model=trace(m.get('session_id'))
        u=m.get('usage') or {}
        g=G.get((qid,cond),{})
        runs.setdefault(qid,{}).setdefault(tag,{})[cond]={
          'model':LABELS.get(model,model),'turns':m.get('num_turns'),'ms':m.get('duration_ms'),
          'tokens':{'in':(u.get('input_tokens') or 0)+(u.get('cache_read_input_tokens') or 0)+(u.get('cache_creation_input_tokens') or 0),'out':u.get('output_tokens') or 0},
          'grade':{k:g.get(k) for k in ('verdict','grounded','refusal','citations','note')},
          'answer':o.get('result') or '','calls':calls,
          'bm25':[{'id':p['id'],'score':p.get('score')} for p in (o.get('passages') or [])]}
for qid in sorted(runs):
    q=Q[qid]; out['questions'].append({'id':qid,'type':q['type'],'q':q['q'],'expected':q['expected'],'required':q.get('required_sources',[]),'addedAfterFreeze':bool(q.get('added_after_freeze')),'afterFixNote':AFTER_FIX.get(qid),'runs':runs[qid]})
ms=[r['model'] for q in out['questions'] for r in q['runs'].get('frozen',{}).values() if r['model']]
out['models']=sorted(set(ms))
json.dump(out,open(f'{R}/app/src/data/coroner.json','w'),ensure_ascii=False)
tot=sum(len(q['runs'].get('frozen',{})) for q in out['questions'])
print('questions',len(out['questions']),'frozen runs',tot,'models',out['models'],'size KB',os.path.getsize(f'{R}/app/src/data/coroner.json')//1024)
