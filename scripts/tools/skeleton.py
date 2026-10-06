# Print an indented tag.class skeleton of an HTML file (for reading captured DOM).
import sys, html.parser
class P(html.parser.HTMLParser):
    def __init__(s): super().__init__(); s.d=0; s.out=[]
    VOID={'img','input','br','hr','meta','link','path','circle','rect','line','polyline','polygon','stop','source'}
    def handle_starttag(s,t,a):
        a=dict(a); c=a.get('class',''); extra=''.join(f' {k}="{a[k][:40]}"' for k in ('role','type','aria-label','value','style','href') if k in a)
        if t not in ('path','circle','rect','line','polyline','stop','defs','lineargradient','g','polygon'):
            s.out.append('  '*s.d+f'<{t}' + (f' .{c}' if c else '') + extra + '>')
        if t not in s.VOID: s.d+=1
    def handle_endtag(s,t):
        if t not in s.VOID: s.d=max(0,s.d-1)
    def handle_data(s,x):
        x=x.strip()
        if x: s.out.append('  '*s.d+'"'+x[:90]+'"')
p=P(); p.feed(open(sys.argv[1],encoding='utf-8').read()); print('\n'.join(p.out))
