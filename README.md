# 椴搁奔寰呭姙 路 WhaleTodo

> 鍒嗙粍寮忓緟鍔炴竻鍗曘€傛椿璺冪殑浜嬫案杩滅疆椤讹紝鍒版湡娌″姩灏辫嚜鍔ㄣ€屾矇娣€銆嶆垚涓嶆椿璺冣€斺€斾笉鍗犺绾匡紝涔熶笉涓€?
涓€涓?Windows 妗岄潰搴旂敤锛圗lectron + React + TypeScript锛夛紝鏁版嵁瀹屽叏瀛樺湪鏈湴锛屼笉鑱旂綉銆佷笉娉ㄥ唽銆?
![鐣岄潰棰勮](docs/screenshots/ui-preview.png)

**English**: WhaleTodo is a group-based todo desktop app. Each task has three states 鈥?active, inactive (sunk) and done. Groups can auto-sink stale active tasks after N days, cap how many active tasks they allow, and every task can also carry its own rule. All data stays in a local JSON file.

## 涓嬭浇 / 鍦ㄧ嚎璇曠敤

- **涓嬭浇瀹夎鍖?*锛氳 [Releases](https://github.com/wafernm-crypto/whaletodo/releases) 椤碉紝鎺ㄨ崘 `椴搁奔寰呭姙-*-win.zip`锛堣В鍘嬪嵆鐢紝涓嶉渶瀹夎锛?- **缃戦〉鐗堣瘯鐢?*锛?https://wafernm-crypto.github.io/whaletodo/>锛堟暟鎹彧瀛樺湪娴忚鍣?localStorage 閲岋級

绯荤粺瑕佹眰锛歐indows 10 / 11锛坸64锛夈€俶acOS 涓?Linux 鏆傛湭鏋勫缓銆?
> 搴旂敤娌℃湁浠ｇ爜绛惧悕璇佷功锛岄娆¤繍琛?Windows 鍙兘鎻愮ず銆屽凡淇濇姢浣犵殑鐢佃剳銆嶏紝鐐广€屾洿澶氫俊鎭?鈫?浠嶈杩愯銆嶅嵆鍙€?
## 涓轰粈涔堝仛杩欎釜

甯歌寰呭姙杞欢鍙湁銆屽畬鎴?/ 鏈畬鎴愩€嶏紝涔呬簡鍒楄〃浼氬彉鎴愪竴鍫靛銆俉haleTodo 澶氫簡涓€灞?*娲昏穬搴?*锛?
- **娲昏穬**锛氱幇鍦ㄧ湡鐨勮澶勭悊鐨勪簨锛屾案杩滃湪鏈€涓婇潰
- **涓嶆椿璺?*锛氭殏鏃朵笉鎯冲仛銆佷絾涓嶆兂鍒犵殑浜嬶紝鑷姩娌夊埌涓嬮潰
- **宸插畬鎴?*锛氬綊妗ｅ尯锛屽彲鎶樺彔銆佸彲涓€閿竻绌?
鍐嶇粰姣忎釜鍒嗙粍閰嶄竴鏉°€岃嚜鍔ㄦ矇娣€銆嶈鍒?鈥斺€?姣斿娲昏穬瓒呰繃 7 澶╁氨娌変笅鍘汇€傝繖鏍风疆椤跺尯涓嶄細瓒婂爢瓒婂锛屽悓鏃舵病鏈変换浣曚簨琚倓鎮勫垹鎺夈€?
## 鍔熻兘

- **鍒嗙粍**锛氭柊寤恒€侀噸鍛藉悕銆佹崲棰滆壊銆佸垹闄わ紱渚ф爮鏄剧ず姣忕粍娲昏穬鏁?- **浜嬮」**锛氭爣棰?+ 澶囨敞锛屽洖杞﹀嵆娣诲姞锛涘弻鍑绘爣棰樻垨鐐归搮绗旇鍐呯紪杈?- **涓夌鐘舵€?*锛氱偣浜嬮」宸︿晶鐨勭姸鎬佹爣绛惧氨鑳藉湪銆屾椿璺?/ 涓嶆椿璺冦€嶄箣闂存墜鍔ㄥ垏鎹紱鍕鹃€夋璐熻矗瀹屾垚
- **鑷姩娌夋穩**锛氭瘡缁勫彲璁俱€屾椿璺冭秴杩?N 澶╄嚜鍔ㄨ浆涓嶆椿璺冦€嶏紝璁℃椂璧风偣鍙€夈€屼粠鍒涘缓绠楄捣銆嶆垨銆屼粠鏈€杩戜竴娆℃縺娲荤畻璧枫€嶏紝涔熻兘鏁寸粍鍏抽棴
- **娲昏穬涓婇檺**锛氭瘡缁勬渶澶氬厑璁?N 涓椿璺冧簨椤癸紱婊′簡涔嬪悗鏂颁簨椤硅嚜鍔ㄨ繘涓嶆椿璺冨尯锛屾墜鍔ㄦ縺娲讳細琚嫤涓嬪苟鎻愮ず
- **浜嬮」绾ф潯浠?*锛氬崟涓簨椤瑰彲浠ヨ鐩栧垎缁勭殑瑙勫垯锛屽崟鐙澶╂暟鍜岃鏃惰捣鐐癸紝鎴栫洿鎺ュ叧鎺夎嚜鍔ㄦ矇娣€
- **鎵嬪姩婵€娲讳細閲嶆柊璁℃椂**锛氭妸娌変笅鍘荤殑浜嬫崬鍥炴潵锛屼笉浼氫笅涓€鍒嗛挓鍙堣瑙勫垯鍘嬪洖鍘?- **鎺掑簭**锛氬尯鍧楀唴涓婄Щ / 涓嬬Щ
- **鎼滅储 + 鐘舵€佺瓫閫?*
- **鍙潬鎬?*锛氬師瀛愬啓鍏?+ 澶囦唤锛涘叧绐楃灛闂村悓姝ヨ惤鐩橈紱鍏宠蒋浠舵湡闂村埌鏈熺殑瑙勫垯涓嬫鍚姩鑷姩琛ョ畻
- **娣辨祬鑹?*璺熼殢绯荤粺

| 浜嬮」璁剧疆 | 鍒嗙粍璁剧疆 |
| --- | --- |
| ![浜嬮」璁剧疆](docs/screenshots/ui-task-panel.png) | ![鍒嗙粍璁剧疆](docs/screenshots/ui-group-panel.png) |

## 鏁版嵁涓庨殣绉?
```
%APPDATA%\WhaleTodo\data.json       涓绘暟鎹?%APPDATA%\WhaleTodo\data.bak.json   涓婁竴娆′繚瀛樼殑澶囦唤
```

- 绾湰鍦?JSON锛屽簲鐢ㄤ笉鍙戜换浣曠綉缁滆姹?- 渚ф爮搴曢儴浼氭樉绀烘暟鎹枃浠剁殑瀹屾暣璺緞
- 鎹㈡満鍣ㄣ€佸浠姐€佽縼绉伙紝鎷疯繖涓€涓枃浠跺氨澶?- 鏃х増鏈暟鎹紙schema 1锛変細鍦ㄥ惎鍔ㄦ椂鑷姩鍗囩骇鍒?schema 2

## 寮€鍙?
闇€瑕?Node.js 18+锛堟帹鑽?20锛夊拰 npm銆?
```bash
npm install          # 瀹夎渚濊禆
npm run dev          # Electron + Vite 鐑洿鏂?npm run preview      # 鍙捣闈欐€侀瑙堟湇鍔★紙http://127.0.0.1:4178锛夛紝娴忚鍣ㄩ噷璋冭瘯鐣岄潰
npm run build:web    # 绫诲瀷妫€鏌?+ 鏋勫缓鍓嶇鍒?dist/
npm start            # 鐢?dist/ 鍚姩 Electron
```

### 鎶€鏈爤

- **Electron 33** 璐熻矗绐楀彛涓庢湰鍦版枃浠惰鍐欙紙`contextIsolation` + 娌欑 preload锛屽彧鏆撮湶璇诲啓鑳藉姏锛?- **React 18 + TypeScript + Vite** 璐熻矗鐣岄潰锛屾病鏈?UI 妗嗘灦銆佹病鏈夌姸鎬佸簱锛屾牱寮忔槸鎵嬪啓 CSS
- **棰嗗煙灞備笌骞冲彴鏃犲叧**锛歚src/core` 鏄函 TS锛堟ā鍨嬨€佽鍒欏紩鎿庛€佸瓨鍌ㄦ帴鍙ｏ級锛屽彲浠ョ洿鎺ユ惉鍘荤Щ鍔ㄧ

### 鐩綍缁撴瀯

```
electron/
  main.mjs         涓昏繘绋嬶細绐楀彛銆両PC銆佸師瀛愬啓 JSON銆佸叧绐楀悓姝ヤ繚瀛?  preload.cjs      鍙毚闇?load / save / saveSync / location
src/
  core/            绾?TS 棰嗗煙灞?    types.ts       Group / Task / GroupRule 鏁版嵁妯″瀷
    model.ts       宸ュ巶銆侀粯璁ゅ€笺€佽剰鏁版嵁褰掍竴鍖?    rules.ts       鑷姩娌夋穩瑙勫垯寮曟搸锛堢函鍑芥暟锛屼紶 now 鍗冲彲娴嬶級
    storage.ts     瀛樺偍鎺ュ彛 + 妗岄潰 / 娴忚鍣ㄤ袱绉嶅疄鐜?  state/store.tsx  reducer銆佽鍒欒ˉ绠椼€侀槻鎶栬惤鐩?  ui/              鐣岄潰缁勪欢
  App.tsx          娲昏穬 / 涓嶆椿璺?/ 宸插畬鎴?涓夊垎鍖虹紪鎺?scripts/           寮€鍙戙€佹墦鍖呫€佹埅鍥鹃獙鏀惰剼鏈?build/             鍥炬爣璧勬簮涓庣敓鎴愯剼鏈?```

### 鐣岄潰楠屾敹宸ュ叿

`scripts/ui-shot.mjs` 鐢?Chrome DevTools Protocol 鎵撳紑椤甸潰銆佹敞鍏ユ祴璇曟暟鎹€佹ā鎷熺偣鍑诲苟鎴浘锛屼笉闇€瑕?Electron锛?
```bash
node scripts/serve.mjs 4178          # 鍙﹀紑缁堢
node scripts/ui-shot.mjs --url http://127.0.0.1:4178/ --seed scripts/seed.json \
  --out build/ui.png --scale 2
node scripts/ui-shot.mjs --url http://127.0.0.1:4178/ --seed scripts/seed.json \
  --out build/panel.png --click '.task:nth-child(2) .task__actions .icon-btn:nth-child(4)'
```

鍕鹃€夋閲岀殑銆屽嬀銆嶆槸绾?CSS 鐢荤殑锛坄translate(-50%, -77%) rotate(-45deg)`锛夛紝鏀瑰姩灏哄鍚庡彲浠ョ敤 `scripts/measure-check.py` 閲忓洖鍍忕礌绾у亸绉汇€?
## 鎵撳寘鍙戝竷

鏈湴锛?
```bash
npm run dist    # 浜у嚭 Setup.exe / 鍏嶅畨瑁?exe / zip 鍒?release/
```

CI锛歔`.github/workflows/release.yml`](.github/workflows/release.yml) 浼氬湪鎺ㄩ€?`v*` 鏍囩鏃惰嚜鍔ㄦ瀯寤哄苟鎶婁骇鐗╂寕鍒?Release锛?
```bash
git tag v0.2.1
git push origin v0.2.1
```

鏋勫缓缁嗚妭锛?
- `scripts/prepare-dist.mjs` 浼氭妸 Electron 鐨?`dist` 澶嶅埗涓€浠斤紝鐢?rcedit 鍐欏叆椴搁奔鍥炬爣鍜屼腑鏂囦骇鍝佷俊鎭紝鎵撳寘鏃?electron-builder 鐩存帴鐢ㄥ畠锛坄.electron-dist/`锛岄粯璁や笉鍏ュ簱锛?- `package.json` 閲?`win.signAndEditExecutable: false` 鏄湁鎰忎负涔嬶細杩欐牱鎵撳寘涓嶉渶瑕佷笅杞?winCodeSign 绛惧悕宸ュ叿閾撅紝鍥炬爣鏀圭敱涓婇潰鐨勮剼鏈礋璐?- 涓诲垎鏀瘡娆℃帹閫佽繕浼氭瀯寤虹綉椤电増骞跺彂甯冨埌 GitHub Pages锛圼`.github/workflows/pages.yml`](.github/workflows/pages.yml)锛?
## 宸茬煡闂

- **娌℃湁浠ｇ爜绛惧悕**锛歐indows SmartScreen 浼氭彁绀烘湭鐭ュ彂甯冭€咃紝灞炴甯哥幇璞?- **鍙瀯寤轰簡 Windows**锛欵lectron 鏈韩璺ㄥ钩鍙帮紝浣嗚繕娌″仛 macOS / Linux 鐨勬瀯寤洪厤缃笌娴嬭瘯
- **NSIS 瀹夎鍖呬緷璧?`%TEMP%`**锛氬鏋滀粠鍙楅檺鐜锛堟瘮濡傛煇浜涘彈闄愬惎鍔ㄥ櫒锛夌洿鎺ュ惎鍔?`Setup.exe`锛屼細鎶?`Error writing temporary file`锛涗粠璧勬簮绠＄悊鍣ㄥ弻鍑伙紝鎴栫洿鎺ョ敤 ZIP 鐗堝嵆鍙?- 浜嬮」鏆備笉鏀寔鎷栨嫿鎺掑簭锛屽彧鑳界敤涓婄Щ / 涓嬬Щ鎸夐挳

## 璺嚎鍥?
1. 妗岄潰绔墦纾細鎷栨嫿鎺掑簭銆佸揩鎹烽敭銆佸鍏ュ鍑恒€佸紑鏈鸿嚜鍚€佽嚜鍔ㄦ洿鏂?2. 绉诲姩绔細澶嶇敤 `src/core`锛岀敤 Capacitor 鎵撳寘锛屽彧鏇挎崲 `storage.ts`
3. 鏁版嵁鍚屾锛氬瓧娈靛凡棰勭暀 `id` / `updatedAt` / `statusChangedAt`锛屾寜銆屾渶鍚庡啓鍏ヨ€呰儨銆嶅悎骞讹紱闇€瑕佹椂鎶婄‖鍒犻櫎鏀规垚杞垹闄わ紙`deletedAt`锛?
## 璐＄尞

娆㈣繋 issue 鍜?PR銆傚紑濮嬩箣鍓嶏細

```bash
npm install
npm run dev
```

鎻愪氦鍓嶈窇涓€閬?`npm run build:web`锛堝寘鍚?`tsc --noEmit`锛夈€傜晫闈㈡敼鍔ㄥ缓璁檮鎴浘锛屾渶濂界敤涓婇潰鐨?`ui-shot.mjs` 鍑哄浘锛屾柟渚垮姣斻€?
## 璁稿彲璇?
[MIT](LICENSE)
