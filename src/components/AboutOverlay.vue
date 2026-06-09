<template>
  <div class="about-overlay" @keydown.escape="$emit(close)">
    <div class="about-bg">
      <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
    </div>
    <div class="about-header">
      <button class="back-btn" @click="$emit(close)" title="??"><i class="fa-solid fa-arrow-left"></i><span class="back-lbl">??</span></button>
      <div class="hd-ic"><i class="fa-solid fa-circle-info"></i></div>
      <div><div class="hd-tl">关于本项目</div></div>
    </div>
    <div class="about-body">
      <div class="hero-sec">
        <div class="emblem"><div class="emblem-ring"></div><div class="emblem-inner"><i class="fa-solid fa-graduation-cap"></i></div></div>
        <div class="v-badge">v3.1</div>
        <h2>北京物资学院 · 校园指南</h2>
        <p class="hero-sub">一个由学生维护的校园设施信息速查平台</p>
      </div>
      <div class="stats">
        <div class="stat"><div class="sn">10</div><div class="sl">设施分类</div></div>
        <div class="stat"><div class="sn">87</div><div class="sl">建筑标记</div></div>
        <div class="stat"><div class="sn">70+</div><div class="sl">数据条目</div></div>
        <div class="stat"><div class="sn">2026</div><div class="sl">持续更新</div></div>
      </div>
      <div class="sec">
        <div class="sec-hd"><div class="sec-ic"><i class="fa-solid fa-lightbulb"></i></div><h3>项目简介</h3></div>
        <p>本指南由北京物资学院经济学院学生 Rocky 独立开发维护，基于 Vue 3 + Vite 构建。覆盖校园内教学楼、宿舍、食堂、运动场、生活服务等 70+ 处设施，集成交互式地图、智能搜索、分类导航、数字校园服务入口等模块。</p>
        <p>所有数据通过 data.js 集中管理，修改即更新，无需动改页面代码。项目持续更新中，目标是成为最全面的校园信息速查工具。</p>
      </div>
      <div class="sec">
        <div class="sec-hd"><div class="sec-ic"><i class="fa-solid fa-list-check"></i></div><h3>主要功能</h3></div>
        <div class="f-grid">
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-map-location-dot"></i></div><span>交互式地图</span><small>缩放拖拽 · 建筑标记 · 分类筛选</small></div>
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-magnifying-glass"></i></div><span>智能搜索</span><small>全字段模糊匹配 · 别名识别</small></div>
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-layer-group"></i></div><span>分类导航</span><small>设施→建筑→设备逐层深入</small></div>
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-building-columns"></i></div><span>数字校园</span><small>教务 · 学工 · 办事大厅直达</small></div>
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-calendar-days"></i></div><span>校历查询</span><small>学期安排 · 时间轴展示</small></div>
          <div class="f-card"><div class="fc-icon"><i class="fa-solid fa-mobile-screen"></i></div><span>全端适配</span><small>手机/平板/桌面响应式布局</small></div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-hd"><div class="sec-ic"><i class="fa-solid fa-code-branch"></i></div><h3>版本信息</h3></div>
        <div class="v-card">
          <div class="v-row"><span class="vl">当前版本</span><span class="vv">V3.1</span></div>
          <div class="v-row"><span class="vl">构建时间</span><span class="vv">2026 年 6 月</span></div>
          <div class="v-row"><span class="vl">技术栈</span><span class="vv">Vue 3 · Vite 5 · Font Awesome</span></div>
          <div class="v-row"><span class="vl">数据管理</span><span class="vv">data.js 集中管理</span></div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-hd"><div class="sec-ic"><i class="fa-solid fa-user-pen"></i></div><h3>作者</h3></div>
        <div class="author">
          <div class="a-av"><div class="a-cir">R</div></div>
          <div class="a-info">
            <div class="a-nm">Rocky</div>
            <div class="a-bio">北京物资学院经济学院学生，本项目由个人课余时间整理维护。</div>
            <div class="a-con"><i class="fa-solid fa-phone"></i> 电话 / 微信：13146617300</div>
          </div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-hd"><div class="sec-ic"><i class="fa-solid fa-book"></i></div><h3>文档</h3></div>
        <a class="doc" href="https://mcnshv1zrzfu.feishu.cn/wiki/KpOiwG0seiYE2SkDE0Yc21sTn8b" target="_blank">
          <span><i class="fa-solid fa-arrow-up-right-from-square"></i> 校园设施信息速查手册</span>
          <i class="fa-solid fa-chevron-right"></i>
        </a>
      </div>
      <div class="sec disc">
        <div class="sec-hd"><div class="sec-ic" style="background:#FFF3E0;color:#E65100;"><i class="fa-solid fa-triangle-exclamation"></i></div><h3 style="color:#E65100;">免责声明</h3></div>
        <ul>
          <li>本指南为个人整理项目，<strong>非学校官方发布</strong>，信息可能存在遗漏或误差。</li>
          <li>部分信息可能因学校安排临时变更，请以<strong>现场通知为准</strong>。</li>
          <li>本指南仅提供客观设施信息供参考。如发现错误请联系维护者修正。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.about-overlay{position:fixed;inset:0;z-index:195;display:flex;flex-direction:column;background:var(--bg);overflow-y:auto;padding-top:56px;animation:ae .4s cubic-bezier(.22,.61,.36,1)}
@keyframes ae{from{opacity:0;transform:scale(.96) translateY(8px);filter:blur(6px)}to{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}
.blob{position:fixed;border-radius:50%;filter:blur(60px);opacity:.15;pointer-events:none;z-index:0;animation:drift 20s ease-in-out infinite alternate}
.b1{width:340px;height:340px;background:var(--primary-pale);top:8%;left:-4%}
.b2{width:280px;height:280px;background:rgba(212,168,83,.1);bottom:12%;right:-3%;animation-delay:-7s}
.b3{width:200px;height:200px;background:rgba(45,106,79,.07);top:45%;left:40%;animation-delay:-14s}
@keyframes drift{0%{transform:translate(0,0)scale(1)}100%{transform:translate(30px,-20px)scale(1.1)}}
.about-header{display:flex;align-items:center;gap:12px;padding:12px 24px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);flex-shrink:0;position:relative;z-index:2}
.hd-tl{font-family:'Noto Serif SC',serif;font-weight:900;font-size:clamp(10px,2.5vw,18px);color:var(--primary)}
.back-btn{width:38px;height:38px;border-radius:10px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;font-size:16px;color:var(--primary);display:flex;align-items:center;justify-content:center;transition:all .25s;flex-shrink:0;overflow:hidden}
.back-btn:hover{width:60px;background:var(--primary);color:#fff;border-color:var(--primary)}
.back-lbl{font-size:0;font-weight:600;transition:font-size .25s;white-space:nowrap}
.back-btn:hover .back-lbl{font-size:12px}
.back-btn:hover i{display:none}
.hd-ic{width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);border-radius:clamp(8px,1.8vw,12px);display:flex;align-items:center;justify-content:center;font-size:clamp(14px,3.5vw,21px);flex-shrink:0;background:var(--primary);color:#fff}
.about-body{position:relative;z-index:1;padding:24px;max-width:720px;margin:0 auto;width:100%}
.hero-sec{text-align:center;padding:36px 0 20px}
.emblem{position:relative;width:72px;height:72px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
.emblem-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--primary-pale);animation:ep 3s ease-in-out infinite}
.emblem-ring::before{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(27,67,50,.06);animation:ep 3s ease-in-out 1s infinite}
@keyframes ep{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.5}}
.emblem-inner{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff;box-shadow:0 6px 24px rgba(27,67,50,.25);position:relative;z-index:1;animation:ed .6s cubic-bezier(.34,1.56,.64,1)}
@keyframes ed{from{transform:scale(0) rotate(-20deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
.v-badge{display:inline-flex;padding:4px 14px;border-radius:20px;background:linear-gradient(135deg,var(--accent),#E8C56D);color:#fff;font-size:11px;font-weight:700;margin-bottom:10px;letter-spacing:.5px;box-shadow:0 2px 8px rgba(212,168,83,.3);animation:fs .5s .15s both}
.hero-sec h2{font-family:'Noto Serif SC',serif;font-weight:900;font-size:clamp(16px,3.5vw,24px);color:var(--primary);margin-bottom:8px;animation:fs .5s .25s both}
.hero-sub{font-size:13px;color:var(--fg-muted);animation:fs .5s .35s both}
@keyframes fs{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:28px;animation:fs .5s .45s both}
@media(max-width:500px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{background:var(--card);border:1px solid var(--bg-deep);border-radius:12px;padding:16px 8px;text-align:center;transition:all .3s}
.stat:hover{border-color:var(--primary-light);box-shadow:0 4px 16px var(--shadow);transform:translateY(-2px)}
.sn{font-family:'Noto Serif SC',serif;font-weight:900;font-size:clamp(18px,3.5vw,24px);color:var(--primary);line-height:1.1}
.sl{font-size:11px;color:var(--fg-muted);margin-top:4px}
.sec{margin-top:32px;animation:fs .5s both}
.sec:nth-of-type(1){animation-delay:.1s}
.sec:nth-of-type(2){animation-delay:.2s}
.sec:nth-of-type(3){animation-delay:.3s}
.sec:nth-of-type(4){animation-delay:.4s}
.sec:nth-of-type(5){animation-delay:.5s}
.sec-hd{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.sec-ic{width:32px;height:32px;border-radius:8px;background:var(--primary-pale);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.sec-hd h3{font-size:15px;font-weight:700;color:var(--primary);margin:0}
.sec p{font-size:clamp(11px,1.8vw,13px);color:var(--fg);line-height:1.9;margin-bottom:10px}
.sec p:last-child{margin-bottom:0}
.f-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media(max-width:700px){.f-grid{grid-template-columns:1fr 1fr}}
@media(max-width:400px){.f-grid{grid-template-columns:1fr}}
.f-card{background:var(--card);border:1px solid var(--bg-deep);border-radius:14px;padding:18px 14px 16px;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;transition:all .3s cubic-bezier(.22,.61,.36,1);position:relative;overflow:hidden}
.f-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--primary-pale),var(--primary-light),var(--primary-pale));opacity:0;transition:opacity .3s}
.f-card:hover{border-color:var(--primary-light);box-shadow:0 8px 24px var(--shadow);transform:translateY(-4px)}
.f-card:hover::before{opacity:1}
.fc-icon{width:42px;height:42px;border-radius:12px;background:var(--primary-pale);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .3s}
.f-card:hover .fc-icon{transform:scale(1.1) rotate(-5deg)}
.f-card span{font-size:13px;font-weight:700;color:var(--primary)}
.f-card small{font-size:11px;color:var(--fg-muted);line-height:1.5}
.v-card{background:var(--card);border:1px solid var(--bg-deep);border-radius:12px;overflow:hidden}
.v-row{display:flex;justify-content:space-between;align-items:center;padding:11px 18px;border-bottom:1px solid var(--bg-deep)}
.v-row:last-child{border-bottom:none}
.vl{font-size:12px;color:var(--fg-muted);font-weight:500}
.vv{font-size:13px;color:var(--primary);font-weight:600}
.author{display:flex;gap:16px;align-items:center;background:var(--card);border:1px solid var(--bg-deep);border-radius:14px;padding:18px 20px;transition:all .3s}
.author:hover{border-color:var(--primary-light);box-shadow:0 6px 20px var(--shadow);transform:translateY(-2px)}
.a-av{position:relative;width:52px;height:52px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.a-cir{width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(14px,3.5vw,20px);position:relative;z-index:1}
.a-av::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--primary-pale);animation:ap 2.5s ease-in-out infinite}
@keyframes ap{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.05);opacity:1}}
.a-info{flex:1;min-width:0}
.a-nm{font-weight:700;font-size:16px;color:var(--primary);margin-bottom:3px}
.a-bio{font-size:12px;color:var(--fg-muted);line-height:1.6}
.a-con{font-size:12px;color:var(--primary);font-weight:500;margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:var(--primary-pale);padding:5px 12px;border-radius:8px}
.doc{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;background:var(--card);border:1.5px solid var(--bg-deep);border-radius:12px;font-size:13px;color:var(--primary);font-weight:600;text-decoration:none;transition:all .3s}
.doc:hover{border-color:var(--primary);background:var(--primary-pale);box-shadow:0 6px 20px var(--shadow);transform:translateY(-2px)}
.doc:hover i:last-child{transform:translateX(4px)}
.doc i:last-child{transition:transform .3s}
.disc{background:linear-gradient(135deg,#FFF8E1,#FFFDE7);border:1px solid #FFE082;border-radius:14px;padding:20px 24px}
.disc ul{list-style:none;margin-top:4px}
.disc li{font-size:12px;color:#827717;padding:5px 0;padding-left:16px;position:relative;line-height:1.6}
.disc li::before{content:'\f058';font-family:'Font Awesome 6 Free';font-weight:900;position:absolute;left:0;font-size:10px;color:#F9A825}
.disc li strong{color:#E65100}
</style>