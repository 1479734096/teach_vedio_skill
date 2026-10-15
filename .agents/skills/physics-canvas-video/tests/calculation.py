"""D 生产门禁计算层正负例；实际渲染与来源验证另行运行。"""
from pathlib import Path
import copy,json,tempfile,traceback,sys,argparse,uuid
import numpy as np
BASE=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(BASE/'scripts'))
import qa_gate as D
from qa_evidence import read_json,write_json,Gate,MissingEvidence
ap=argparse.ArgumentParser();ap.add_argument('--out',default='qa_calculation');args=ap.parse_args()
OUTPUT=Path(args.out).resolve()/('calculation_'+uuid.uuid4().hex[:10]);OUTPUT.mkdir(parents=True)
results=[]
cache={}
def d_gate(name):
    topic={'test1_standing_wave':'standing_wave','test2_lc_circuit':'lc_circuit','test3_convolution':'convolution','test4_rc_circuit':'rc_circuit'}[name]
    if topic not in cache:cache[topic]=read_json(BASE/'tests/fixtures'/str(topic+'.json'))
    fixture=cache[topic];g=D.QAGate(BASE/'tests');g.cfg=copy.deepcopy(fixture['cfg']);g.manifest=copy.deepcopy(fixture['manifest']);g.frames=copy.deepcopy(fixture['frames']);g.runtime=copy.deepcopy(fixture['runtime'])
    return g
def evaluate_case(case, target, expected, make, mutate=None, method=None, level='生产门禁计算层注入'):
    try:
        gate = make()
        if mutate:
            mutate(gate)
        selected = getattr(gate, method) if isinstance(method, str) else method or getattr(gate,{'standing_wave':'waves','lc_circuit':'lc','convolution':'convolution','rc_circuit':'rc'}[gate.cfg['topic']])
        gate.invoke(target.split('.')[0], selected)
        matches = [r for r in gate.results if r['id'] == target]
        actual = matches[-1]['status'] if matches else 'MISSING_RESULT'
        row = {'case': case, 'level': level, 'target': target, 'expected': expected, 'actual': actual, 'intercepted': actual == expected, 'source_project': str(gate.project_dir), 'source_build_run_id': gate.manifest['run_id'] if gate.manifest else None, 'evidence': matches[-1]['evidence'] if matches else gate.results}
    except Exception as e:
        row = {'case': case, 'level': level, 'target': target, 'expected': expected, 'actual': 'HARNESS_ERROR', 'intercepted': False, 'error': repr(e), 'traceback': traceback.format_exc()}
    results.append(row)
    print(f"{case}: {row['actual']} / expected={expected}", flush=True)

def each(g, kind, fn):
    for frame in g.frames:
        for r in frame.get('physics', []):
            if r['kind'] == kind:
                fn(r)

def main():
    wave = lambda: d_gate('test1_standing_wave')
    lc = lambda: d_gate('test2_lc_circuit')
    conv = lambda: d_gate('test3_convolution')
    rc = lambda: d_gate('test4_rc_circuit')
    for title, make, target in [('驻波相速度正例', wave, 'Suite I.velocity_incident'), ('驻波节点正例', wave, 'Suite I.nodes'), ('LC 能量正例', lc, 'Suite I.lc_energy'), ('LC 微分正例', lc, 'Suite I.lc_derivative'), ('卷积逐点积分正例', conv, 'Suite I.conv_integral'), ('卷积非对称支撑翻转正例', conv, 'Suite I.conv_flip'), ('RC 时间常数正例', rc, 'Suite I.rc_fit_charge'), ('RC 能量正例', rc, 'Suite I.rc_energy_charge')]:
        evaluate_case(title, target, 'PASS', make)

    def wrong_wave(g):
        p = g.cfg['parameters']
        w = 2 * np.pi / p['period_T_s']
        b = 2 * np.pi / p['wavelength_lambda_px']
        amp = p['amplitude_A_px']
        each(g, 'wave', lambda r: r.update(points=[[x, float(amp * np.cos(1.2 * w * r['sim_t'] - b * x))] for x, _ in r['points']]) if r['wave_type'] == 'incident' else None)
    evaluate_case('标称正确、实际波形速度错误', 'Suite I.velocity_incident', 'FAIL', wave, wrong_wave)

    def reverse_wave(g):
        for f in g.frames:
            for r in f['physics']:
                if r['kind'] == 'wave' and r['wave_type'] == 'incident':
                    r['points'] = [[x, float(g.cfg['parameters']['amplitude_A_px'] * np.cos(np.pi * r['sim_t'] + 2 * np.pi / 500 * x))] for x, _ in r['points']]
    evaluate_case('标称正确、实际波形方向反转', 'Suite I.velocity_incident', 'FAIL', wave, reverse_wave)

    def drift(g):
        each(g, 'wave', lambda r: r.update(points=[[x, float(150 * np.cos(2 * np.pi / 500 * (x - 10 * r['sim_t'])) * np.cos(np.pi * r['sim_t']))] for x, _ in r['points']]) if r['wave_type'] == 'standing' else None)
    evaluate_case('驻波节点实际漂移', 'Suite I.nodes', 'FAIL', wave, drift)
    evaluate_case('LC 储能错误', 'Suite I.lc_energy', 'FAIL', lc, lambda g: each(g, 'lc_state', lambda r: r.update(q_px=r['q_px'] * 1.3)))
    evaluate_case('LC 能量条与实际 q/i 储能不符', 'Suite I.lc_gauge', 'FAIL', lc, lambda g: each(g, 'lc_state', lambda r: r.update(q_px=r['q_px'] * 1.3)))
    evaluate_case('LC 微分关系符号错误', 'Suite I.lc_derivative', 'FAIL', lc, lambda g: each(g, 'lc_state', lambda r: r.update(i_px=-r['i_px'])))
    evaluate_case('卷积漏翻转', 'Suite I.conv_flip', 'FAIL', conv, lambda g: each(g, 'conv_flip', lambda r: r.update(left=abs(r['left']), right=abs(r['right']))))

    def wrong_integral(g):
        count = 0
        for f in g.frames:
            for r in f['physics']:
                if r['kind'] == 'conv_output':
                    r['value_px'] += 5 if count % 2 else -5
                    count += 1
    evaluate_case('卷积输出交替偏差、平均偏差接近零', 'Suite I.conv_integral', 'FAIL', conv, wrong_integral)
    evaluate_case('卷积声明面积与实际输入不符', 'Suite I.conv_areas', 'FAIL', conv, lambda g: g.cfg['parameters'].update(area_f=99))

    def wrong_tau(g):
        V = g.cfg['parameters']['voltage_V0_v']
        tau = g.cfg['parameters']['time_constant_tau_s']
        each(g, 'rc_state', lambda r: r.update(vc=float(V * (1 - np.exp(-r['sim_t'] / (tau * 1.5))))) if r['mode'] == 'charge' else None)
    evaluate_case('RC 实际充电时间常数错误', 'Suite I.rc_fit_charge', 'FAIL', rc, wrong_tau)
    evaluate_case('RC KVL 关系错误', 'Suite I.rc_laws_charge', 'FAIL', rc, lambda g: each(g, 'rc_state', lambda r: r.update(i=r['i'] * 1.3) if r['mode'] == 'charge' else None))
    evaluate_case('RC 能量收支错误', 'Suite I.rc_energy_charge', 'FAIL', rc, lambda g: each(g, 'rc_state', lambda r: r.update(i=r['i'] * 1.3) if r['mode'] == 'charge' else None))
    evaluate_case('合法 LC 实际图例', 'Suite I.lc_caption', 'PASS', lc, method='check_lc_caption')

    def wrong_caption(g):
        for f in g.frames:
            for b in f.get('text_boxes', []):
                if '电流 i(t)' in b['text']:
                    b['text'] = b['text'].replace('= I₀ sin', '= −I₀ sin').replace('相位滞后', '相位超前')
    evaluate_case('LC 实际图例符号/相位错误', 'Suite I.lc_caption', 'FAIL', lc, wrong_caption, method='check_lc_caption')
    evaluate_case('合法 RC SPDT 实际连接', 'Suite I.rc_topology', 'PASS', rc, method='check_rc_topology')

    def bypass(g):
        each(g, 'rc_topology', lambda r: r['segments'].append([r['ports']['common'], r['ports']['source']]))
    evaluate_case('RC 背景导线绕过开关', 'Suite I.rc_topology', 'FAIL', rc, bypass, method='check_rc_topology')

    def floating_contact(g):
        each(g, 'rc_topology', lambda r: r.update(segments=[e for e in r['segments'] if not (e[0][0] == e[1][0] and e[0][1] != e[1][1])]))
    evaluate_case('RC 放电触点未接地', 'Suite I.rc_topology', 'FAIL', rc, floating_contact, method='check_rc_topology')
    evaluate_case('NaN 物理量', 'Suite I.error', 'FAIL', lc, lambda g: each(g, 'lc_state', lambda r: r.update(q_px=float('nan'))))
    evaluate_case('空物理序列', 'Suite I.input', 'NOT_RUN', lc, lambda g: [f.update(physics=[]) for f in g.frames])

    def teleport(g):
        for f in g.frames:
            if abs(f['t'] - 2.0) < 1e-08:
                for o in f['legacy']['tracked_objects']:
                    o['world_x'] += 350
    for title, make, mut, target, expected, fn in [('单帧锚点瞬移', wave, teleport, 'Suite H.motion', 'FAIL', 'check_suite_h'), ('文字重叠', wave, lambda g: g.frames[60].update(text_boxes=[{'text': '甲', 'alpha': 1, 'bbox': [100, 100, 300, 140]}, {'text': '乙', 'alpha': 1, 'bbox': [110, 105, 310, 145]}]), 'Suite C.collision', 'FAIL', 'check_suite_c'), ('字幕越界', wave, lambda g: g.frames[60].update(text_boxes=[{'text': '越界', 'alpha': 1, 'bbox': [100, 930, 300, 970]}]), 'Suite C.boundary', 'FAIL', 'check_suite_c'), ('空字体记录', wave, lambda g: g.runtime.update(fonts=[]), 'Suite D.input', 'NOT_RUN', 'check_suite_d'), ('空确定性记录', wave, lambda g: g.runtime.update(repeatability=[]), 'Suite G.input', 'NOT_RUN', 'check_suite_g'), ('文字记录缺少alpha字段', wave, lambda g: g.frames[60]['text_boxes'][0].pop('alpha'), 'Suite C.input', 'NOT_RUN', 'check_suite_c'), ('重复采样缺少实际时间字段', wave, lambda g: g.runtime['repeatability'][0].pop('t'), 'Suite G.input', 'NOT_RUN', 'check_suite_g'), ('字体加载合法记录', wave, lambda g: None, 'Suite D.loaded', 'PASS', 'check_suite_d'), ('实际字体全部加载失败', wave, lambda g: [r.update(status='error') for r in g.runtime['fonts']], 'Suite D.loaded', 'FAIL', 'check_suite_d')]:
        evaluate_case(title, target, expected, make, mut, method=fn)
    with tempfile.TemporaryDirectory(prefix='qa_交接_') as folder:
        root = Path(folder)
        (root / 'src').mkdir()
        (root / 'qa').mkdir()
        write_json(root / 'physics_config.json', {'topic': 'standing_wave', 'parameters': {}})
        empty = D.QAGate(root)
        empty.invoke('Suite A', empty.check_suite_a)
        results.append({'case': '空参数表', 'level': '生产门禁配置解析', 'target': 'Suite A.error', 'expected': 'FAIL', 'actual': empty.results[-1]['status'], 'intercepted': empty.results[-1]['status'] == 'FAIL', 'evidence': empty.results})
    write_json(OUTPUT / 'report.json', {'cases': results, 'passed': sum((r['intercepted'] for r in results)), 'total': len(results), 'note': '计算层故障注入不等价于独立渲染负例；真实渲染负例另存。'})
    return 0 if all((r['intercepted'] for r in results)) else 1

if __name__=='__main__':raise SystemExit(main())
