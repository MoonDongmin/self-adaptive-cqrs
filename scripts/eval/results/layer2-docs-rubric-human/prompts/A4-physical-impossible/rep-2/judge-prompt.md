당신은 이벤트 소싱 + CQRS 기반 Physical AI 데이터 플랫폼의 시니어 아키텍트이자 엄격한 평가자다. LLM 파이프라인이 [자료](로그·이벤트·스키마 정보)를 보고 [Docs]를 생성했다. Docs 는 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소를 항상 함께 담아야 하는 단일 산출물이다. 당신은 [정답 요지]와 [자료], [자동 검증 결과]를 기준으로 Docs 를 네 항목의 루브릭으로 채점한다. 채점은 관대하지 않게, 근거 없는 주장·지어낸 값·의도와 다른 SQL·서로 어긋나는 절에는 낮은 점수를 준다. 반드시 JSON 객체 하나만 출력한다. 설명문·마크다운 펜스는 출력하지 않는다.

---

[시나리오] A4-physical-impossible
[상황] 운영 중 센서 관찰기가 파지 센서 값 이상 에피소드를 감지했다.
[정답 요지] 값 하나만 봐도 물리적으로 불가능한 센서 값(깊이 z1<0, 이미지 밖 픽셀 xl=2500)이 파지 결과에 적재됨. 조치: 위반 값을 플래그/격리하는 Read Model(v2 또는 별도 테이블)과 CHECK 제약, v1 무손상.

[자료] — Docs 생성 시 파이프라인이 받은 로그·이벤트·스키마 정보
<<<자료 시작>>>
<logging_context>
## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R6 suddenJump_withinScene: 같은 sceneKey '반려동물용품_CR01_강아지공룡알장난감_00263' 내 attempt 간 z평균 -0.0762 → 0.1119, Δ=0.188 > 0.10 m / [윈도우 2] R3 pixelRangeViolation: record 반려동물용품_CR01_강아지공룡알장난감_02007#1 has xl=2500.0 which exceeds image width 1920 / R2 depthNegative: record 반려동물용품_CR01_강아지공룡알장난감_02006#1 has minz=-0.083 which is <= 0 (physically impossible depth)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_00263, 반려동물용품_CR01_강아지공룡알장난감_02007, 반려동물용품_CR01_강아지공룡알장난감_02006
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00256","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00256","globalSequence":17,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":891.304,"xr":1023.04,"yl":787.666,"yr":745.401},"grip3dPose":{"x1":0.13919184093715767,"x2":0.0966719411630518,"x3":0.11795583750204616,"x4":0.16047573727615203,"x5":0.17397462000500838,"x6":0.13145472023090252,"x7":0.15273861656989687,"x8":0.19525851634400274,"y1":0.7490693068342725,"y2":0.8819830440686679,"y3":0.890019805103775,"y4":0.7571060678693796,"y5":0.7555920669748531,"y6":0.8885058042092485,"y7":0.8965425652443556,"y8":0.7636288280099602,"z1":0.13967940727878525,"z2":0.12845458756593073,"z3":0.1429944028569008,"z4":0.1542192225697553,"z5":0.0851577429565588,"z6":0.0739329232437043,"z7":0.08847273853467437,"z8":0.09969755824752886},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[948.1091737544714,851.5537126115654,2,1074.3894022842053,847.596212572172,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00258","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258","globalSequence":18,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":773.771,"xr":905.629,"yl":596.049,"yr":605.903},"grip3dPose":{"x1":-0.044569325827483436,"x2":-0.04582561078074657,"x3":-0.01947923220633081,"x4":-0.018222947253067674,"x5":-0.030365696650319907,"x6":-0.03162198160358304,"x7":-0.005275603029167282,"x8":-0.0040193180759041484,"y1":0.6403114494436267,"y2":0.7754764522455281,"y3":0.777241086297736,"y4":0.6420760834958347,"y5":0.62391815036518,"y6":0.7590831531670813,"y7":0.7608477872192893,"y8":0.6256827844173879,"z1":0.18227449363006595,"z2":0.14582118423738946,"z3":0.15145628873290276,"z4":0.18790959812557925,"z5":0.12100038275506245,"z6":0.08454707336238595,"z7":0.09018217785789925,"z8":0.12663548725057575},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[679.6486940085271,601.8098293707798,2,793.868446639224,605.4943319909484,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00262","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262","globalSequence":19,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1068.39,"xr":1182.4,"yl":418.009,"yr":381.523},"grip3dPose":{"x1":-0.2814074294431292,"x2":-0.28722617178008414,"x3":-0.2602992331476942,"x4":-0.25448049081073926,"x5":-0.2853490210773393,"x6":-0.29116776341429423,"x7":-0.2642408247819043,"x8":-0.25842208244494935,"y1":0.944708809841979,"y2":1.0685177170518072,"y3":1.070271753560811,"y4":0.9464628463509829,"y5":0.9747572270183692,"y6":1.0985661342281976,"y7":1.1003201707372015,"y8":0.976511263527373,"z1":0.1347257353198928,"z2":0.19982179305862435,"z3":0.19889263655265316,"z4":0.1337965788139216,"z5":0.07722307033310506,"z6":0.1423191280718366,"z7":0.1413899715658654,"z8":0.07629391382713387},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1168.612903434567,396.7192682096995,2,1275.5372124573125,395.5837886991851,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00262","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262","globalSequence":20,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":750.389,"xr":598.138,"yl":788.887,"yr":785.864},"grip3dPose":{"x1":-0.2814074294431292,"x2":-0.28722617178008414,"x3":-0.2602992331476942,"x4":-0.25448049081073926,"x5":-0.2853490210773393,"x6":-0.29116776341429423,"x7":-0.2642408247819043,"x8":-0.25842208244494935,"y1":0.944708809841979,"y2":1.0685177170518072,"y3":1.070271753560811,"y4":0.9464628463509829,"y5":0.9747572270183692,"y6":1.0985661342281976,"y7":1.1003201707372015,"y8":0.976511263527373,"z1":0.1347257353198928,"z2":0.19982179305862435,"z3":0.19889263655265316,"z4":0.1337965788139216,"z5":0.07722307033310506,"z6":0.1423191280718366,"z7":0.1413899715658654,"z8":0.07629391382713387},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[495.9167488416591,779.9011240315085,2,625.5288438670475,785.2960083197662,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00263","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263","globalSequence":21,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":908.081,"xr":987.342,"yl":383.983,"yr":458.69},"grip3dPose":{"x1":-0.31444851435874915,"x2":-0.2090571560657172,"x3":-0.19128476651639706,"x4":-0.296676124809429,"x5":-0.31476410732525995,"x6":-0.209372749032228,"x7":-0.19160035948290785,"x8":-0.2969917177759398,"y1":0.7775332825971927,"y2":0.8696621604143063,"y3":0.8493479380139809,"y4":0.7572190601968672,"y5":0.7794603715652707,"y6":0.8715892493823844,"y7":0.8512750269820589,"y8":0.7591461491649453,"z1":0.1607557815716738,"z2":0.16297647274991206,"z3":0.1622876055803275,"z4":0.16006691440208926,"z5":0.09578512104564407,"z6":0.09800581222388233,"z7":0.09731694505429778,"z8":0.09509625387605952},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[931.2007359451235,366.84891763661903,2,1035.2019732299686,369.15769957794504,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00267","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267","globalSequence":22,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1118.24,"xr":1196.94,"yl":681.685,"yr":566.236},"grip3dPose":{"x1":0.1328404079571509,"x2":0.21202586996054554,"x3":0.23408464425822925,"x4":0.15489918225483462,"x5":0.14013938585577193,"x6":0.21932484785916656,"x7":0.24138362215685027,"x8":0.16219816015345564,"y1":0.6184044224370137,"y2":0.7336758347779483,"y3":0.7187773095597979,"y4":0.6035058972188633,"y5":0.6097845745533287,"y6":0.7250559868942633,"y7":0.7101574616761129,"y8":0.5948860493351783,"z1":0.14496139320604634,"z2":0.13846800393424324,"z3":0.1429895548637348,"z4":0.14948294413553787,"z5":0.08095027585837325,"z6":0.07445688658657017,"z7":0.07897843751606172,"z8":0.0854718267878648},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1181.6032521541758,690.1934076547064,2,1306.668925004412,699.251096819155,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00269","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269","globalSequence":23,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":945.925,"xr":1060.35,"yl":544.984,"yr":594.343},"grip3dPose":{"x1":-0.11233311536875618,"x2":-0.04646242471547642,"x3":-0.02264797971318188,"x4":-0.08851867036646163,"x5":-0.11064808010613433,"x6":-0.044777389452854595,"x7":-0.020962944450560052,"x8":-0.08683363510383979,"y1":0.8155895733220148,"y2":0.9384950721207136,"y3":0.9257816775378241,"y4":0.8028761787391253,"y5":0.8212496690184287,"y6":0.9441551678171275,"y7":0.931441773234238,"y8":0.8085362744355392,"z1":0.1459528660833831,"z2":0.15841442609419057,"z3":0.15792268692303743,"z4":0.14546112691222995,"z5":0.08122169914757729,"z6":0.09368325915838477,"z7":0.09319151998723163,"z8":0.08072995997642415},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[983.6090330870444,565.09091989279,2,980.8344719650294,674.9635360486245,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00275","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275","globalSequence":24,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1111.48,"xr":1126.96,"yl":494.404,"yr":354.501},"grip3dPose":{"x1":0.12095561056444452,"x2":0.1337287669698559,"x3":0.15970888770302014,"x4":0.14693573129760878,"x5":0.1376285388598226,"x6":0.15040169526523395,"x7":0.1763818159983982,"x8":0.16360865959298684,"y1":0.7938571803160209,"y2":0.9328896341382756,"y3":0.9300003309270019,"y4":0.7909678771047471,"y5":0.7969899661366492,"y6":0.9360224199589039,"y7":0.9331331167476301,"y8":0.7941006629253754,"z1":0.12666752674202506,"z2":0.13700306057465955,"z3":0.1437621473209243,"z4":0.1334266134882898,"z5":0.06392042230636802,"z6":0.07425595613900252,"z7":0.08101504288526726,"z8":0.07067950905263276},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1173.6235322939592,459.8519668088688,2,1274.4583324260225,384.6531328120758,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00275","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":937.454,"xr":813.654,"yl":416.582,"yr":398.544},"grip3dPose":{"x1":0.12095561056444452,"x2":0.1337287669698559,"x3":0.15970888770302014,"x4":0.14693573129760878,"x5":0.1376285388598226,"x6":0.15040169526523395,"x7":0.1763818159983982,"x8":0.16360865959298684,"y1":0.7938571803160209,"y2":0.9328896341382756,"y3":0.9300003309270019,"y4":0.7909678771047471,"y5":0.7969899661366492,"y6":0.9360224199589039,"y7":0.9331331167476301,"y8":0.7941006629253754,"z1":0.12666752674202506,"z2":0.13700306057465955,"z3":0.1437621473209243,"z4":0.1334266134882898,"z5":0.06392042230636802,"z6":0.07425595613900252,"z7":0.08101504288526726,"z8":0.07067950905263276},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[905.6527776600876,361.15139360379146,2,843.4618956388609,285.72046652655933,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02006","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02006","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":686.577,"xr":815.736,"yl":568.457,"yr":571.171},"grip3dPose":{"x1":-0.08295444579564601,"x2":-0.07761240237863838,"x3":-0.05073137928675942,"x4":-0.05607342270376705,"x5":-0.0773865231126301,"x6":-0.07204447969562247,"x7":-0.04516345660374351,"x8":-0.05050550002075114,"y1":0.5320270141299829,"y2":0.6719224531047695,"y3":0.6708818901935841,"y4":0.5309864512187975,"y5":0.5322095740109324,"y6":0.672105012985719,"y7":0.6710644500745336,"y8":0.531169011099747,"z1":-0.05,"z2":0.16363007175608307,"z3":0.16593828023057916,"z4":0.165084625626793,"z5":0.09801558864550719,"z6":0.09886924324929336,"z7":0.10117745172378945,"z8":0.10032379712000328},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[683.7064989795188,654.9318309019866,2,785.4550203754471,588.543369897714,2],"num_keypoints":2}]}
⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02006#1] grip3dPoseZ(z1)=-0.05 (깊이 ≤ 0 — 카메라 뒤/평면 위 물체는 불가능)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02007","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02007","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":2500,"xr":1023.04,"yl":787.666,"yr":745.401},"grip3dPose":{"x1":0.13919184093715767,"x2":0.0966719411630518,"x3":0.11795583750204616,"x4":0.16047573727615203,"x5":0.17397462000500838,"x6":0.13145472023090252,"x7":0.15273861656989687,"x8":0.19525851634400274,"y1":0.7490693068342725,"y2":0.8819830440686679,"y3":0.890019805103775,"y4":0.7571060678693796,"y5":0.7555920669748531,"y6":0.8885058042092485,"y7":0.8965425652443556,"y8":0.7636288280099602,"z1":0.13967940727878525,"z2":0.12845458756593073,"z3":0.1429944028569008,"z4":0.1542192225697553,"z5":0.0851577429565588,"z6":0.0739329232437043,"z7":0.08847273853467437,"z8":0.09969755824752886},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[948.1091737544714,851.5537126115654,2,1074.3894022842053,847.596212572172,2],"num_keypoints":2}]}
⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02007#1] grip2dPose(xl)=2500 (이미지 경계 [0, 1920]px 밖 — 화면 밖 픽셀 좌표는 불가능)
```
</logging_context>

<insight_read_db>
## ReadModel: read_grip_result

용도: 장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)

키: (scene_key, attempt_num)

```mschema
# Table: read_grip_result
[
(scene_key:varchar, 장면 식별 키 = {카테고리}_{카메라코드}_{객체명}_{장면번호} (stream_id에서 'grip-attempt:' 제거), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호 (파일명의 시도번호), Primary Key, Examples: [1]),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Examples: [강아지공룡알장난감]),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공), Examples: [1]),
(gripper_type:varchar(16), 그리퍼 종류 (현재 적재는 finger 고정, 흡착형은 suction), Examples: [finger]),
(occurred_at:timestamptz, 데이터 촬영 일자 (파일명 날짜에서 도출), Examples: [2023-09-23T00:00:00Z]),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y), Examples: [{"xl":0,"xr":0,"yl":0,"yr":0}]),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate), Examples: [{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}]),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개), Examples: [{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}]),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역 (핑거: keypoints 2점), Examples: [[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]]),
(stream_id:varchar, ES 스트림 ID ("grip-attempt:" + scene_key) — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

## ReadModel: read_multimodal

용도: 장면별 2D이미지·비디오 미디어 링크 조회

키: (scene_key, attempt_num)

```mschema
# Table: read_multimodal
[
(scene_key:varchar, 장면 식별 키 (read_grip_result와 동일 규칙), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호, Primary Key, Examples: [1]),
(occurred_at:timestamptz, 데이터 촬영 일자, Examples: [2023-09-23T00:00:00Z]),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg]),
(image_2d_uri:text, 2D 이미지 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(video_file_name:varchar, 원천 비디오 파일명 (시도번호 자리가 항상 00 — 한 비디오 N:1로 여러 시도가 공유), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4]),
(video_uri:text, 비디오 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(stream_id:varchar, ES 스트림 ID — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```
</insight_read_db>
<<<자료 끝>>>

[자동 검증 결과] — 실제 데이터베이스 실행·컴파일 결과. 실행 가능성 판단의 실측 근거로 삼는다.
- 문서 검사: 실패 항목 hanCharacterFree
- SQL 실행: 블록 4개 중 4개 실행 성공
- 코드 컴파일: 파일 4개 중 4개 통과

[저장소 파일 확인] — 파이프라인은 진단 도구로 저장소 소스 코드를 조회할 수 있다. Docs 가 인용한 파일 경로의 실재 여부와 앞부분 발췌이다.
- 저장소에 실재하는 파일 (4건): src/projection/projection.controller.ts, src/projection/projection.service.ts, src/projection/projector/grip-result.projector.ts, src/projection/runner/catch-up.runner.ts
- 저장소에 없는 파일 (1건): src/shared/database/schema/service/read-grip-outlier-v2.ts

<<<src/projection/projection.controller.ts 앞부분 80행>>>
import { Controller, Post } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertAndProjectionAllResult, ProjectionService } from '@/projection/projection.service';
import { ProjectionResult } from '@/projection/projector/projector';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/multimodal")
  multimodal(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/insert-all",
      },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}

<<<발췌 끝>>>

<<<src/projection/projection.service.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
};

export type InsertAndProjectionAllResult = {
  insert: InsertResult;
  projection: CatchUpAllResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult };
  }

  async insertAllAndProjectAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_START },
      "전체 적재+투영 시작",
    );

    const insert: InsertResult = await this.insertService.insertToyData();
    const projection: CatchUpAllResult = await this.catchUpAll();

    this.logger.info(
      { action: LogAction.PROJECTION_DONE },
      "전체 적재+투영 완료",
    );

    return { insert, projection };
  }
}

<<<발췌 끝>>>

<<<src/projection/projector/grip-result.projector.ts 앞부분 80행>>>
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { SensorValueMessage } from '@/projection/kafka/sensor-value.message';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripResult } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripResultInsert = InferInsertModel<typeof readGripResult>;

@Injectable()
export class GripResultProjector implements Projector<ReadGripResultInsert> {
  readonly name: string = "grip-result-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripResultProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripResultInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    if (payload.objects.length === 0) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
        },
        "objects 비어 있음",
      );

      throw new Error(
        `grip-result map: empty objects in event ${event.eventId}`,
      );
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      objectName: payload.objects[0].class_name,
      gripSucceed: payload.grip_succeed,
      gripperType: "finger",
      occurredAt: event.occurredAt,
      grip2dPose: payload.grip_data.grip_2d_pose,
      grip3dPose: payload.grip_data.grip_3d_pose,
      robotTf: payload.robot_tf,
      humanAnnotationGrasp: payload.human_annotation_grasp,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
<<<발췌 끝>>>

<<<src/projection/runner/catch-up.runner.ts 앞부분 80행>>>
import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SENSOR_VALUE_PUBLISHER, type SensorValuePublisher } from '@/projection/kafka/sensor-value.publisher';
import { IntegrityViolation, ProjectionResult, Projector } from '@/projection/projector/projector';
import {
  EVENT_STORE_READER,
  EventStoreEventRow,
  type EventStoreReaderRepository,
} from '@/projection/repository/event-store-reader.repository';
import {
  PROJECTION_CURSOR,
  type ProjectionCursorRepository,
} from '@/projection/repository/projection-cursor.repository';
import { DRIZZLE, type Drizzle } from '@/shared/database/drizzle.provider';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Injectable()
export class CatchUpRunner {
  private static readonly BATCH_SIZE: number = 500;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: Drizzle,
    @Inject(EVENT_STORE_READER)
    private readonly reader: EventStoreReaderRepository,
    @Inject(PROJECTION_CURSOR)
    private readonly cursors: ProjectionCursorRepository,
    @Optional()
    @Inject(SENSOR_VALUE_PUBLISHER)
    private readonly sensorPublisher?: SensorValuePublisher,
  ) {
    this.logger.setContext(CatchUpRunner.name);
  }

  async run<Insert>(projector: Projector<Insert>): Promise<ProjectionResult> {
    const startedAt: number = Date.now();
    const fromSeq: number = await this.cursors.getOrInit(projector.name);

    this.logger.info(
      {
        action: LogAction.PROJECTION_START,
        [LogContext.PROJECTOR_NAME]: projector.name,
        [LogContext.FROM_SEQ]: fromSeq,
      },
      "catch-up 시작",
    );

    let lastProcessed: number = fromSeq;
    let processed: number = 0;

    for (;;) {
      const events: EventStoreEventRow[] = await this.reader.fetchAfter(
        lastProcessed,
        CatchUpRunner.BATCH_SIZE,
      );

      if (events.length === 0) {
        break;
      }

      const batchFrom: number = lastProcessed;
      const batchTo: number = events[events.length - 1].globalSeq;

      const rows: Insert[] = [];

      try {
        await this.db.transaction(async (tx) => {
          for (const event of events) {
            const row: Insert = projector.map(event);

            await projector.upsert(tx, row);
            rows.push(row);
          }

          await this.cursors.update(tx, projector.name, batchTo);
        });
      } catch (err) {
        this.logger.error(
          {
<<<발췌 끝>>>

[Docs] — 채점 대상 문서 전문
<<<Docs 시작>>>
---
docId: dq-반려동물용품_CR01_강아지공룡알장난감_00263
generatedAt: 2026-08-11T02:44:12.589Z
targetReadModel: read_grip_result
sqlDialect: postgres
sufficientEvidence: true
apiVersion:
  from: v1
  to: v2
  affectedEndpoints:
    - "POST /multimodal"
    - "POST /grip-result"
    - "POST /grip-outlier-v2"
    - "POST /insert-all"
evidenceSources:
  - { origin: insight-read-db, anchorId: "seq:26" }
  - { origin: insight-read-db, anchorId: "seq:27" }
constraints:
  - "v1 자산(테이블/엔드포인트/프로젝터 name) 무손상"
  - "PK (scene_key, attempt_num) 유지"
  - "TypeScript any 금지"
  - "식별자 전체 단어"
  - "DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)"
  - "Read Model 테이블명은 read_ 접두 스네이크 케이스"
---

# Self-Adaptive CQRS Docs — read_grip_result

> 결론(TL;DR): `read_grip_result`을(를) 재생성한다 — Record 02006#1 has negative depth (-0.05m), violating physical constraints. Record 02007#1 has xl=2500px, exceeding image width (1920px). Both passed into the DB despite being physically impossible or out-of-bounds. (이상 유형: Sensor Baseline Deviation · 심각도: critical)

<logging_context>

## 센서 이상 배치 (관찰자 1차 판정 — 검증 전 가설)
> 사유: [윈도우 1] R6 suddenJump_withinScene: 같은 sceneKey '반려동물용품_CR01_강아지공룡알장난감_00263' 내 attempt 간 z평균 -0.0762 → 0.1119, Δ=0.188 > 0.10 m / [윈도우 2] R3 pixelRangeViolation: record 반려동물용품_CR01_강아지공룡알장난감_02007#1 has xl=2500.0 which exceeds image width 1920 / R2 depthNegative: record 반려동물용품_CR01_강아지공룡알장난감_02006#1 has minz=-0.083 which is <= 0 (physically impossible depth)
> 의심 sceneKey: 반려동물용품_CR01_강아지공룡알장난감_00263, 반려동물용품_CR01_강아지공룡알장난감_02007, 반려동물용품_CR01_강아지공룡알장난감_02006
> 위 사유는 소형 1차 관찰자의 출력이라 인용 수치·부등호가 부정확할 수 있는 **가설**이다.
> 근거로 쓸 관측값·부등호는 반드시 아래 원시 레코드에서 재확인해 원문 그대로 인용하고,
> 원시 레코드에서 재확인되지 않는 1차 사유는 기각해라.

### 투영된 센서 값 (JSON 한 줄당 한 레코드)
```json
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00256","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00256","globalSequence":17,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":891.304,"xr":1023.04,"yl":787.666,"yr":745.401},"grip3dPose":{"x1":0.13919184093715767,"x2":0.0966719411630518,"x3":0.11795583750204616,"x4":0.16047573727615203,"x5":0.17397462000500838,"x6":0.13145472023090252,"x7":0.15273861656989687,"x8":0.19525851634400274,"y1":0.7490693068342725,"y2":0.8819830440686679,"y3":0.890019805103775,"y4":0.7571060678693796,"y5":0.7555920669748531,"y6":0.8885058042092485,"y7":0.8965425652443556,"y8":0.7636288280099602,"z1":0.13967940727878525,"z2":0.12845458756593073,"z3":0.1429944028569008,"z4":0.1542192225697553,"z5":0.0851577429565588,"z6":0.0739329232437043,"z7":0.08847273853467437,"z8":0.09969755824752886},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[948.1091737544714,851.5537126115654,2,1074.3894022842053,847.596212572172,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00258","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00258","globalSequence":18,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":773.771,"xr":905.629,"yl":596.049,"yr":605.903},"grip3dPose":{"x1":-0.044569325827483436,"x2":-0.04582561078074657,"x3":-0.01947923220633081,"x4":-0.018222947253067674,"x5":-0.030365696650319907,"x6":-0.03162198160358304,"x7":-0.005275603029167282,"x8":-0.0040193180759041484,"y1":0.6403114494436267,"y2":0.7754764522455281,"y3":0.777241086297736,"y4":0.6420760834958347,"y5":0.62391815036518,"y6":0.7590831531670813,"y7":0.7608477872192893,"y8":0.6256827844173879,"z1":0.18227449363006595,"z2":0.14582118423738946,"z3":0.15145628873290276,"z4":0.18790959812557925,"z5":0.12100038275506245,"z6":0.08454707336238595,"z7":0.09018217785789925,"z8":0.12663548725057575},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[679.6486940085271,601.8098293707798,2,793.868446639224,605.4943319909484,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00262","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262","globalSequence":19,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1068.39,"xr":1182.4,"yl":418.009,"yr":381.523},"grip3dPose":{"x1":-0.2814074294431292,"x2":-0.28722617178008414,"x3":-0.2602992331476942,"x4":-0.25448049081073926,"x5":-0.2853490210773393,"x6":-0.29116776341429423,"x7":-0.2642408247819043,"x8":-0.25842208244494935,"y1":0.944708809841979,"y2":1.0685177170518072,"y3":1.070271753560811,"y4":0.9464628463509829,"y5":0.9747572270183692,"y6":1.0985661342281976,"y7":1.1003201707372015,"y8":0.976511263527373,"z1":0.1347257353198928,"z2":0.19982179305862435,"z3":0.19889263655265316,"z4":0.1337965788139216,"z5":0.07722307033310506,"z6":0.1423191280718366,"z7":0.1413899715658654,"z8":0.07629391382713387},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1168.612903434567,396.7192682096995,2,1275.5372124573125,395.5837886991851,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00262","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00262","globalSequence":20,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":750.389,"xr":598.138,"yl":788.887,"yr":785.864},"grip3dPose":{"x1":-0.2814074294431292,"x2":-0.28722617178008414,"x3":-0.2602992331476942,"x4":-0.25448049081073926,"x5":-0.2853490210773393,"x6":-0.29116776341429423,"x7":-0.2642408247819043,"x8":-0.25842208244494935,"y1":0.944708809841979,"y2":1.0685177170518072,"y3":1.070271753560811,"y4":0.9464628463509829,"y5":0.9747572270183692,"y6":1.0985661342281976,"y7":1.1003201707372015,"y8":0.976511263527373,"z1":0.1347257353198928,"z2":0.19982179305862435,"z3":0.19889263655265316,"z4":0.1337965788139216,"z5":0.07722307033310506,"z6":0.1423191280718366,"z7":0.1413899715658654,"z8":0.07629391382713387},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[495.9167488416591,779.9011240315085,2,625.5288438670475,785.2960083197662,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00263","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00263","globalSequence":21,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":908.081,"xr":987.342,"yl":383.983,"yr":458.69},"grip3dPose":{"x1":-0.31444851435874915,"x2":-0.2090571560657172,"x3":-0.19128476651639706,"x4":-0.296676124809429,"x5":-0.31476410732525995,"x6":-0.209372749032228,"x7":-0.19160035948290785,"x8":-0.2969917177759398,"y1":0.7775332825971927,"y2":0.8696621604143063,"y3":0.8493479380139809,"y4":0.7572190601968672,"y5":0.7794603715652707,"y6":0.8715892493823844,"y7":0.8512750269820589,"y8":0.7591461491649453,"z1":0.1607557815716738,"z2":0.16297647274991206,"z3":0.1622876055803275,"z4":0.16006691440208926,"z5":0.09578512104564407,"z6":0.09800581222388233,"z7":0.09731694505429778,"z8":0.09509625387605952},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[931.2007359451235,366.84891763661903,2,1035.2019732299686,369.15769957794504,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00267","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00267","globalSequence":22,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1118.24,"xr":1196.94,"yl":681.685,"yr":566.236},"grip3dPose":{"x1":0.1328404079571509,"x2":0.21202586996054554,"x3":0.23408464425822925,"x4":0.15489918225483462,"x5":0.14013938585577193,"x6":0.21932484785916656,"x7":0.24138362215685027,"x8":0.16219816015345564,"y1":0.6184044224370137,"y2":0.7336758347779483,"y3":0.7187773095597979,"y4":0.6035058972188633,"y5":0.6097845745533287,"y6":0.7250559868942633,"y7":0.7101574616761129,"y8":0.5948860493351783,"z1":0.14496139320604634,"z2":0.13846800393424324,"z3":0.1429895548637348,"z4":0.14948294413553787,"z5":0.08095027585837325,"z6":0.07445688658657017,"z7":0.07897843751606172,"z8":0.0854718267878648},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1181.6032521541758,690.1934076547064,2,1306.668925004412,699.251096819155,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00269","attemptNumber":2,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00269","globalSequence":23,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":945.925,"xr":1060.35,"yl":544.984,"yr":594.343},"grip3dPose":{"x1":-0.11233311536875618,"x2":-0.04646242471547642,"x3":-0.02264797971318188,"x4":-0.08851867036646163,"x5":-0.11064808010613433,"x6":-0.044777389452854595,"x7":-0.020962944450560052,"x8":-0.08683363510383979,"y1":0.8155895733220148,"y2":0.9384950721207136,"y3":0.9257816775378241,"y4":0.8028761787391253,"y5":0.8212496690184287,"y6":0.9441551678171275,"y7":0.931441773234238,"y8":0.8085362744355392,"z1":0.1459528660833831,"z2":0.15841442609419057,"z3":0.15792268692303743,"z4":0.14546112691222995,"z5":0.08122169914757729,"z6":0.09368325915838477,"z7":0.09319151998723163,"z8":0.08072995997642415},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[983.6090330870444,565.09091989279,2,980.8344719650294,674.9635360486245,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00275","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275","globalSequence":24,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":1111.48,"xr":1126.96,"yl":494.404,"yr":354.501},"grip3dPose":{"x1":0.12095561056444452,"x2":0.1337287669698559,"x3":0.15970888770302014,"x4":0.14693573129760878,"x5":0.1376285388598226,"x6":0.15040169526523395,"x7":0.1763818159983982,"x8":0.16360865959298684,"y1":0.7938571803160209,"y2":0.9328896341382756,"y3":0.9300003309270019,"y4":0.7909678771047471,"y5":0.7969899661366492,"y6":0.9360224199589039,"y7":0.9331331167476301,"y8":0.7941006629253754,"z1":0.12666752674202506,"z2":0.13700306057465955,"z3":0.1437621473209243,"z4":0.1334266134882898,"z5":0.06392042230636802,"z6":0.07425595613900252,"z7":0.08101504288526726,"z8":0.07067950905263276},"robotTf":{"rotation_3x3":[0.999992,0.003878,-0.000419,0.003871,-0.999845,-0.017179,-0.000485,0.017177,-0.999852],"translation_3x1":[-0.011986,0.750103,1.02053]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[1173.6235322939592,459.8519668088688,2,1274.4583324260225,384.6531328120758,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_00275","attemptNumber":3,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00275","globalSequence":25,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":937.454,"xr":813.654,"yl":416.582,"yr":398.544},"grip3dPose":{"x1":0.12095561056444452,"x2":0.1337287669698559,"x3":0.15970888770302014,"x4":0.14693573129760878,"x5":0.1376285388598226,"x6":0.15040169526523395,"x7":0.1763818159983982,"x8":0.16360865959298684,"y1":0.7938571803160209,"y2":0.9328896341382756,"y3":0.9300003309270019,"y4":0.7909678771047471,"y5":0.7969899661366492,"y6":0.9360224199589039,"y7":0.9331331167476301,"y8":0.7941006629253754,"z1":0.12666752674202506,"z2":0.13700306057465955,"z3":0.1437621473209243,"z4":0.1334266134882898,"z5":0.06392042230636802,"z6":0.07425595613900252,"z7":0.08101504288526726,"z8":0.07067950905263276},"robotTf":{"rotation_3x3":[0.029246,-0.946137,0.322443,-0.99956,-0.029255,0.004819,0.004874,-0.322442,-0.946577],"translation_3x1":[-0.332466,0.755481,1.0337]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[905.6527776600876,361.15139360379146,2,843.4618956388609,285.72046652655933,2],"num_keypoints":2}]}
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02006","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02006","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":686.577,"xr":815.736,"yl":568.457,"yr":571.171},"grip3dPose":{"x1":-0.08295444579564601,"x2":-0.07761240237863838,"x3":-0.05073137928675942,"x4":-0.05607342270376705,"x5":-0.0773865231126301,"x6":-0.07204447969562247,"x7":-0.04516345660374351,"x8":-0.05050550002075114,"y1":0.5320270141299829,"y2":0.6719224531047695,"y3":0.6708818901935841,"y4":0.5309864512187975,"y5":0.5322095740109324,"y6":0.672105012985719,"y7":0.6710644500745336,"y8":0.531169011099747,"z1":-0.05,"z2":0.16363007175608307,"z3":0.16593828023057916,"z4":0.165084625626793,"z5":0.09801558864550719,"z6":0.09886924324929336,"z7":0.10117745172378945,"z8":0.10032379712000328},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[683.7064989795188,654.9318309019866,2,785.4550203754471,588.543369897714,2],"num_keypoints":2}]}
⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02006#1] grip3dPoseZ(z1)=-0.05 (깊이 ≤ 0 — 카메라 뒤/평면 위 물체는 불가능)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02007","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02007","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":2500,"xr":1023.04,"yl":787.666,"yr":745.401},"grip3dPose":{"x1":0.13919184093715767,"x2":0.0966719411630518,"x3":0.11795583750204616,"x4":0.16047573727615203,"x5":0.17397462000500838,"x6":0.13145472023090252,"x7":0.15273861656989687,"x8":0.19525851634400274,"y1":0.7490693068342725,"y2":0.8819830440686679,"y3":0.890019805103775,"y4":0.7571060678693796,"y5":0.7555920669748531,"y6":0.8885058042092485,"y7":0.8965425652443556,"y8":0.7636288280099602,"z1":0.13967940727878525,"z2":0.12845458756593073,"z3":0.1429944028569008,"z4":0.1542192225697553,"z5":0.0851577429565588,"z6":0.0739329232437043,"z7":0.08847273853467437,"z8":0.09969755824752886},"robotTf":{"rotation_3x3":[0.014497,0.909648,-0.415128,0.999887,-0.011494,0.009732,0.004081,-0.415222,-0.909711],"translation_3x1":[0.327688,0.821407,1.03805]},"humanAnnotationGrasp":[{"annotation_type":"keypoint","id":11,"annotation_points":[948.1091737544714,851.5537126115654,2,1074.3894022842053,847.596212572172,2],"num_keypoints":2}]}
⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02007#1] grip2dPose(xl)=2500 (이미지 경계 [0, 1920]px 밖 — 화면 밖 픽셀 좌표는 불가능)
```

</logging_context>

<insight_read_db>

## ReadModel: read_grip_result

용도: 장면별 로봇 파지 결과 조회 (성공여부·포즈·그리퍼)

키: (scene_key, attempt_num)

```mschema
# Table: read_grip_result
[
(scene_key:varchar, 장면 식별 키 = {카테고리}_{카메라코드}_{객체명}_{장면번호} (stream_id에서 'grip-attempt:' 제거), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호 (파일명의 시도번호), Primary Key, Examples: [1]),
(object_name:varchar, 파지 대상 객체명 (payload.objects[0].class_name), Examples: [강아지공룡알장난감]),
(grip_succeed:smallint, 파지 성공 여부 (0=실패, 1=성공), Examples: [1]),
(gripper_type:varchar(16), 그리퍼 종류 (현재 적재는 finger 고정, 흡착형은 suction), Examples: [finger]),
(occurred_at:timestamptz, 데이터 촬영 일자 (파일명 날짜에서 도출), Examples: [2023-09-23T00:00:00Z]),
(grip_2d_pose:jsonb, 2D 파지점 (핑거: xl,xr,yl,yr / 흡착: x,y), Examples: [{"xl":0,"xr":0,"yl":0,"yr":0}]),
(grip_3d_pose:jsonb, 3D 파지점 (핑거: x1..z8 24좌표 / 흡착: x,y,z,roll,pitch,yaw,penetrate), Examples: [{"x1":10.2,"y1":3.1,"z1":-100.0, "...":"...", "z8":-90.5}]),
(robot_tf:jsonb, 로봇 변환행렬 (rotation_3x3 9개 + translation_3x1 3개), Examples: [{"rotation_3x3":[1,0,0,0,1,0,0,0,1],"translation_3x1":[0,0,0]}]),
(human_annotation_grasp:jsonb, 휴먼 어노테이션 파지 영역 (핑거: keypoints 2점), Examples: [[{"annotation_type":"keypoints","id":1,"annotation_points":[120,330,140,360],"num_keypoints":2}]]),
(stream_id:varchar, ES 스트림 ID ("grip-attempt:" + scene_key) — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

## ReadModel: read_multimodal

용도: 장면별 2D이미지·비디오 미디어 링크 조회

키: (scene_key, attempt_num)

```mschema
# Table: read_multimodal
[
(scene_key:varchar, 장면 식별 키 (read_grip_result와 동일 규칙), Primary Key, Examples: [반려동물용품_CR01_강아지공룡알장난감_00018]),
(attempt_num:smallint, 같은 장면 내 파지 시도 번호, Primary Key, Examples: [1]),
(occurred_at:timestamptz, 데이터 촬영 일자, Examples: [2023-09-23T00:00:00Z]),
(image_2d_file_name:varchar, 원천 2D 이미지 파일명 (payload.2D_image_file_name), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_01_20230923.jpg]),
(image_2d_uri:text, 2D 이미지 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(video_file_name:varchar, 원천 비디오 파일명 (시도번호 자리가 항상 00 — 한 비디오 N:1로 여러 시도가 공유), Examples: [반려동물용품_CR01_강아지공룡알장난감_00018_00_20230923.mp4]),
(video_uri:text, 비디오 저장 위치 URI (현재 projector가 null로 둠 — 추후 매핑)),
(stream_id:varchar, ES 스트림 ID — 추적 키, Examples: [grip-attempt:반려동물용품_CR01_강아지공룡알장난감_00018]),
(global_seq:bigint, 투영 출처 이벤트의 ES 전역 시퀀스 — 추적 키, Examples: [1024])
]
```

</insight_read_db>

## 1. 권고 (Recommendation)

> 관측된 3D 깊이(z1) 음수 값과 2D 좌표(xl) 초과치로, 물리적 제약 위배 판정이 확정되어 데이터 품질은 심각(critical) 수준.

### 심각도 — critical

오염이 grip2dPose·grip3dPose jsonb 컬럼에 집중되며 2개 행만 해당되나, event_store 원본 기록은 완전한 payload를 보유하여 재투영으로 정상 복구 가능.

### 기대-실측 델타 근거

- (반려동물용품_CR01_강아지공룡알장난감_02006#1, `grip3dPose` / grip3dPose) 관측 `-0.05` vs 기준 `grip3dPoseZ_depth` [0.01, 0.30] m → 델타 -0.06 m (z1 하단 한도 미달) · 카메라 프레임 기준 깊이 ≤ 0은 물리적 불가능
- (반려동물용품_CR01_강아지공룡알장난감_02007#1, `grip2dPose` / grip2dPose) 관측 `2500` vs 기준 `grip2dPose_withinImage` x in [0, 1920], y in [0, 1110] → 델타 +580 px (xl 상단 한도 초과) · 이미지 센서 경계 밖 픽셀 좌표는 비정상

### 관찰

- z1=-0.05위배 grip3dPoseZ_depth 규칙
- xl=2500초과 grip2dPose_withinImage 한도

### 영향 범위

- event_store
- grip-result-projector.ts
- read_grip_result
- projection.controller.ts

### 근본원인 — projectionOrPipelineFault

1. 관측 z1≤0과 xl>1920왜 허용에 DB?
2. Zod 스키마는 오직 타입 검증을 수행하며, 물리적 범위 검사는 누락됨.
3. 프로젝터에 checkIntegrity 구현이 미등록되어 의미적 오류 통과.
4. 베이스라인 규칙은 존재하나, 투영 파이프라인 연결 고도 부재.
5. 시스템적 갭: 구조적 zod 검증은 존재하나, 도메인 정합성 enforced enforcement는 초기 Read Model 설계 생략.

### 의사결정 기준

- physical_constraint_enforcement
- data_retention_policy
- pipeline_integration_cost

### 해결책 옵션 (contain → fix → harden)

#### [contain] 오염 행 격리 플래그
- 접근: 원본 event_store 보존, read_grip_result 해당 row 삭제 후 재투영으로 복장.
- 트레이드오프: 추적 고도 손절그러나 원값 증거 완전 보존.
```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02006', 1), ('반려동물용품_CR01_강아지공룡알장난감_02007', 1));
```

#### [fix] 프로젝터 정합성 검사 추가
- 접근: GripResultProjector.checkIntegrity 구현으로 z1/xl 범위 검증.
- 트레이드오프: 투영 latency 미미 증가但 소스 레벨 오류 차단.
```typescript
checkIntegrity(row: ReadGripResultInsert): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  const z1Raw = row.grip3dPose?.z1;
  if (typeof z1Raw === 'number' && z1Raw < 0.01) {
    violations.push({ readModelName: "read_grip_result", sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: row.streamId, globalSeq: row.globalSeq, ruleName: "grip3dPoseZ_depth", affectedColumns: ["grip_3d_pose"], observedValue: String(z1Raw), expected: "[0.01, 0.30] m", detail: `z1=${z1Raw}위배 물리적 깊이 제약` });
  }
  const xlRaw = row.grip2dPose?.xl;
  if (typeof xlRaw === 'number' && xlRaw > 1920) {
    violations.push({ readModelName: "read_grip_result", sceneKey: row.sceneKey, attemptNum: row.attemptNum, streamId: row.streamId, globalSeq: row.globalSeq, ruleName: "grip2dPose_withinImage", affectedColumns: ["grip_2d_pose"], observedValue: String(xlRaw), expected: "x in [0, 1920]", detail: `xl=${xlRaw}초과 이미지 width 한도` });
  }
  return violations;
}
```

#### [harden] DB CHECK 제약 추가
- 접근: read_grip_result jsonb 필드 CHECK constraint.
- 트레이드오프: DB 레벨 enforced但 JSONB casting语法 brittle.

### 권장
- 프로젝터 정합성 검사 추가
- 사유: 소스 레벨 차단이 event_store 무개입 그리고 기존 CatchUpRunner 로그 파이프라인 적합. 확정 설계 read_grip_outlier_v2 채택으로 이상 플래그 추가 및 재투영 파이프라인 연동.
- 수용하는 트레이드오프: 투영 pipeline latency 미미 증가 수용 그리고 신규 테이블 스키마 유지보수 부담.
- 기각한 대안:
  - contain: 추적 고도 손절그러나 재투영 overhead 발생
  - harden: JSONB CHECK constraint Postgres语法 한계 그리고 유지보수 brittle

### 즉시 격리 SQL

```sql
-- 오염 행 격리: 이상 (scene_key, attempt_num) 행을 Read Model 에서 제거한다.
-- 원본 이벤트는 event_store 에 보존되므로 v2 재투영(무결성 플래그 포함)으로 복원 가능하다.
DELETE FROM read_grip_result WHERE (scene_key, attempt_num) IN (('반려동물용품_CR01_강아지공룡알장난감_02006', 1), ('반려동물용품_CR01_강아지공룡알장난감_02007', 1));
```

### 하드닝(베이스라인 추가 규칙)

rule: grip3dPoseZ_physicalConstraint expected: z1 ≥ 0.01 m | rule: grip2dPose_xl_upperBound expected: xl ≤ 1920 px

### 다음 단계

- Implement checkIntegrity in GripResultProjector (`src/projection/projector/grip-result.projector.ts`) — 30 lines, projection engineer
- Add outlier flagging logic to CatchUpRunner (`src/projection/runner/catch-up.runner.ts`) — 50 lines, pipeline operator
- Execute read_grip_outlier_v2 migration (`src/shared/database/schema/service/read-grip-outlier-v2.ts`) — 1 file, schema maintainer

## 2. Read Model 생성 SQL (Read Model DDL)

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

- 대상: `read_grip_outlier_v2` · 키: scene_key, attempt_num · 원천 이벤트: GripAttemptRecorded

```sql
DROP TABLE IF EXISTS read_grip_outlier_v2;

CREATE TABLE read_grip_outlier_v2 (
  scene_key VARCHAR NOT NULL,
  attempt_num SMALLINT NOT NULL,
  object_name VARCHAR NOT NULL,
  grip_succeed SMALLINT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  z1_raw DOUBLE PRECISION,
  xl_raw DOUBLE PRECISION,
  depth_negative_flag SMALLINT NOT NULL DEFAULT 0,
  pixel_xl_out_of_bounds_flag SMALLINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_grip_outlier_v2_pk ON read_grip_outlier_v2 (scene_key, attempt_num);
CREATE INDEX idx_grip_outlier_v2_time ON read_grip_outlier_v2 (occurred_at);
```

### 필드

```mschema
# Table: read_grip_outlier_v2
[
(scene_key:varchar, 장면 식별 키, Primary Key),
(attempt_num:smallint, 시도 번호, Primary Key),
(object_name:varchar, 객체명),
(grip_succeed:smallint, 성공여부 (0/1)),
(occurred_at:timestamp, 데이터 촬영 일자),
(z1_raw:doublePrecision, 3D 좌표 z1 원치 측정값),
(xl_raw:doublePrecision, 2D 좌표 xl 원치 측정값),
(depth_negative_flag:smallint, z1 ≤ 0 위반 플래그 (1:위반, 0:양호)),
(pixel_xl_out_of_bounds_flag:smallint, xl > 1920 위반 플래그 (1:위반, 0:양호))
]
```

### 투영 매핑 명세 (이벤트 → 컬럼)

> upsert 키: scene_key, attempt_num · 리플레이: projection_cursor 초기화 시 첫 이벤트 처리 기준. 전체 재투영(catch-up) 시 upsert 전제 조건(멱idency)을 반드시 유지하여 중복/과부하 삽입 방지.

| 원천 이벤트 | payload 필드 | 컬럼 | 변환 |
| --- | --- | --- | --- |
| GripAttemptRecorded | sceneKey | scene_key | verbatim |
| GripAttemptRecorded | attemptNumber | attempt_num | verbatim |
| GripAttemptRecorded | objectName | object_name | verbatim |
| GripAttemptRecorded | gripSucceed | grip_succeed | verbatim |
| GripAttemptRecorded | occurredAt | occurred_at | verbatim |

파생 컬럼(이벤트 payload 아님):
- `depth_negative_flag` ← (z1_raw <= 0) ? 1 : 0
- `pixel_xl_out_of_bounds_flag` ← (xl_raw > 1920) ? 1 : 0

### Insight 카드 등록 (Insight Read DB 동기화)

> DDL 적용 시 아래 카드 등록도 함께 실행한다 — 다음 분석부터 신규 Read Model 이 LLM 컨텍스트에 노출된다.

```sql
INSERT INTO insight_entity (entity_name, kind, purpose, key_columns)
VALUES ('read_grip_outlier_v2', 'read_model', '전용 정합성 플래그 및 원치 측정값 추출 테이블로, 기존 JSONB 포즈 저장이 아닌 z1(깊이)와 xl(픽셀) 수치 열과 위반 플래그 열을 제공하여 센서 베이스라인 편만 분석과 SQL 필터링을 효율하게 지원.', 'scene_key, attempt_num')
ON CONFLICT (entity_name) DO UPDATE SET purpose = EXCLUDED.purpose, key_columns = EXCLUDED.key_columns;

INSERT INTO insight_field (entity_name, field_name, data_type, meaning, display_order)
VALUES
  ('read_grip_outlier_v2', 'scene_key', 'varchar', '장면 식별 키', 1),
  ('read_grip_outlier_v2', 'attempt_num', 'smallint', '시도 번호', 2),
  ('read_grip_outlier_v2', 'object_name', 'varchar', '객체명', 3),
  ('read_grip_outlier_v2', 'grip_succeed', 'smallint', '성공여부 (0/1)', 4),
  ('read_grip_outlier_v2', 'occurred_at', 'timestamp', '데이터 촬영 일자', 5),
  ('read_grip_outlier_v2', 'z1_raw', 'doublePrecision', '3D 좌표 z1 원치 측정값', 6),
  ('read_grip_outlier_v2', 'xl_raw', 'doublePrecision', '2D 좌표 xl 원치 측정값', 7),
  ('read_grip_outlier_v2', 'depth_negative_flag', 'smallint', 'z1 ≤ 0 위반 플래그 (1:위반, 0:양호)', 8),
  ('read_grip_outlier_v2', 'pixel_xl_out_of_bounds_flag', 'smallint', 'xl > 1920 위반 플래그 (1:위반, 0:양호)', 9)
ON CONFLICT (entity_name, field_name) DO UPDATE SET data_type = EXCLUDED.data_type, meaning = EXCLUDED.meaning, display_order = EXCLUDED.display_order;
```

## 3. API Versioning

> 실행 게이트: 아래 변경은 인간 승인 후에만 적용한다 (human-in-the-loop).

### Unreleased (v1 → v2)

#### Added
- 신규 Read Model 테이블 read_grip_outlier_v2 (z1_raw, xl_raw, depth_negative_flag, pixel_xl_out_of_bounds_flag)
- 신규 Projector GripOutlierProjector 배선
- 라우트 /projection/grip-outlier-v2 배선

### 마이그레이션 절차

- 하위호환 변경: 기존 read_grip_result, read_multimodal 테이블·프로젝터·라우트는 무손상 유지. v2는 purely additive DI wiring.; 신규 테이블은 기존 키(scene_key, attempt_num)와 동시 보존 설계로 backward compatible.
- 파괴적 변경: 없음
- 컷오버 전 테스트: 1. catchUpGripOutlierV2() 실행하여 read_grip_outlier_v2 populate.
2. SELECT depth_negative_flag = 1 OR pixel_xl_out_of_bounds_flag = 1 FROM read_grip_outlier_v2 WHERE occurred_at < cutover_timestamp LIMIT 100 검증.
3. v1 GripResultProjector 기존 적재 데이터 integrity checkIntegrity() 결과 null 확인.
- 롤백 창/조건: ROLLBACK: DROP TABLE IF EXISTS read_grip_outlier_v2; DROP INDEX idx_grip_outlier_v2_pk; DROP INDEX idx_grip_outlier_v2_time; 제거 DI 배선(ProjectionService, ProjectionController) revert. v1 Read Model은 그대로 운영.
- Insight 카드 등록: §2의 카드 등록 SQL을 DDL과 함께 적용(카탈로그 동기화)

### 사유·호환성

- 사유: 기존 v1 GripResultProjector는 raw JSON pose 값을 Read Model 테이블에 직접 적재 tanpa 물리적/이미지 경계 검증. 이로 인해 z1 ≤ 0(카메라 뒤/평면 위)과 xl > 1920px(화인 밖) 값이 DB에 누적되어 downstream 분석 및 baseline deviation 감지가 왜곡됨. 신규 read_grip_outlier_v2 테이블은 원치 측정값(z1_raw, xl_raw)과 위반 플래그(depth_negative_flag, pixel_xl_out_of_bounds_flag)를 동시 보존하여 이상 로그와 정성 데이터 분기.
- 트리거 근거: [Seq 26] ⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02006#1] grip3dPoseZ(z1)=-0.05 (깊이 ≤ 0 — 카메라 뒤/평면 위 물체는 불가능)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02006","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02006","globalSequence":26,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":686.577,"xr":815.736,"yl":568.457,"yr":571.171},"grip3dPose":{"x1":-0.08295444579564601,...,"z1":-0.05,...}} [corr:1]

[Seq 27] ⚠ physical [반려동물용품_CR01_강아지공룡알장난감_02007#1] grip2dPose(xl)=2500 (이미지 경계 [0, 1920]px 밖 — 화면 밖 픽셀 좌표는 불가능)
{"sceneKey":"반려동물용품_CR01_강아지공룡알장난감_02007","attemptNumber":1,"streamId":"grip-attempt:반려동물용품_CR01_강아지공룡알장난감_02007","globalSequence":27,"occurredAt":"2023-09-23T00:00:00.000Z","objectName":"강아지공룡알장난감","gripSucceed":0,"grip2dPose":{"xl":2500,...},"grip3dPose":{"x1":0.13919184093715767,...}} [corr:2]

v1 GripResultProjector.map() 메서드(라인 48-52)는 payload.grip_data.grip_2d_pose 및 grip_3d_pose 객체를 Read Model 테이블에 직접 할당 tanpa 물리적/이미지 경계 검증. 이로 인해 z1 ≤ 0과 xl > 1920px 값이 DB에 누적되어 downstream 분석 왜곡.
- v1 호환성: 기존 read_grip_result, read_multimodal 테이블·엔드포인트·프로젝터 클래스/이름은 무손상. v2는 신규 테이블(read_grip_outlier_v2)과 신규 프로젝터(GripOutlierProjector)를 DI 배선만 추가하여 동시 운영.

### 변경 파일

- `src/projection/projection.service.ts` (modifyFile) — 신규 GripOutlierProjector 주입 및 catchUpGripOutlierV2 메서드 배선. 기존 catchUpMultimodal/catchUpGripResult/insertAllAndProjectAll 메서드는 보존.
- `src/projection/projection.controller.ts` (modifyFile) — /grip-outlier-v2 라우트 배선. 기존 /multimodal, /grip-result, /insert-all 엔드포인트는 보존.

## Optional — 부속 자료(컨텍스트 축소 시 생략 가능)

### 신규 Read Model — Drizzle 스키마

```ts
import { bigint, index, smallint, timestamp, varchar, doublePrecision, pgTable, primaryKey } from 'drizzle-orm/pg-core';

export const readGripOutlierV2 = pgTable(
  "read_grip_outlier_v2",
  {
    sceneKey: varchar("scene_key").notNull(),
    attemptNum: smallint("attempt_num").notNull(),

    objectName: varchar("object_name").notNull(),
    gripSucceed: smallint("grip_succeed").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    z1Raw: doublePrecision("z1_raw"),
    xlRaw: doublePrecision("xl_raw"),

    depthNegativeFlag: smallint("depth_negative_flag").notNull(),
    pixelXlOutOfBoundsFlag: smallint("pixel_xl_out_of_bounds_flag").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sceneKey, t.attemptNum] }),
    index("idx_grip_outlier_v2_time").on(t.occurredAt),
  ],
);
```

### 신규 Read Model — Projector

```ts
import { Injectable } from '@nestjs/common';
import { type InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { type ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import type { Projector } from '@/projection/projector/projector';
import type { EventStoreEventRow } from '@/projection/repository/event-store-reader.repository';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readGripOutlierV2 } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

type ReadGripOutlierV2Insert = InferInsertModel<typeof readGripOutlierV2>;

@Injectable()
export class GripOutlierProjector implements Projector<ReadGripOutlierV2Insert> {
  readonly name: string = "grip-outlier-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GripOutlierProjector.name);
  }

  map(event: EventStoreEventRow): ReadGripOutlierV2Insert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (error) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          error,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw error;
    }

    const sceneKey: string = event.streamId.replace(/^grip-attempt:/, "");
    const attemptNum: number = event.attemptNum;
    const objectName: string = payload.objects[0].class_name;
    const gripSucceed: number = payload.grip_succeed;
    const occurredAt: Date = event.occurredAt;

    const z1Raw: number | null = payload.grip_data.grip_3d_pose.z1 ?? null;
    const xlRaw: number | null = payload.grip_data.grip_2d_pose.xl ?? null;

    const depthNegativeFlag: number = (z1Raw !== null && z1Raw <= 0) ? 1 : 0;
    const pixelXlOutOfBoundsFlag: number = (xlRaw !== null && xlRaw > 1920) ? 1 : 0;

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: sceneKey,
        [LogContext.ATTEMPT_NUM]: attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey,
      attemptNum,
      objectName,
      gripSucceed,
      occurredAt,
      z1Raw,
      xlRaw,
      depthNegativeFlag,
      pixelXlOutOfBoundsFlag,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadGripOutlierV2Insert): Promise<void> {
    await tx
      .insert(readGripOutlierV2)
      .values(row)
      .onConflictDoUpdate({
        target: [readGripOutlierV2.sceneKey, readGripOutlierV2.attemptNum],
        set: {
          objectName: row.objectName,
          gripSucceed: row.gripSucceed,
          occurredAt: row.occurredAt,
          z1Raw: row.z1Raw,
          xlRaw: row.xlRaw,
          depthNegativeFlag: row.depthNegativeFlag,
          pixelXlOutOfBoundsFlag: row.pixelXlOutOfBoundsFlag,
        },
      });
  }
}
```

### 신규 Read Model — 배선(컨트롤러/서비스/모듈)

```ts
export * from "./service/read-grip-outlier-v2";

// ProjectionService constructor injection & catchUp method:
private readonly gripOutlierV2: GripOutlierProjector,

catchUpGripOutlierV2(): Promise<ProjectionResult> {
  return this.runner.run(this.gripOutlierV2);
}

// ProjectionController @Post route:
@Post("/grip-outlier-v2")
gripOutlierV2(): Promise<ProjectionResult> {
  this.logger.info(
    { action: LogAction.PROJECTION_REQUEST, [LogContext.ROUTE]: "POST /projection/grip-outlier-v2" },
    "projection 요청 수신",
  );
  return this.projectionService.catchUpGripOutlierV2();
}

// ProjectionModule providers registration:
GripOutlierProjector,

/* NOTE: 신규 v2 테이블은 레거시 read_grip_result와 독립. 전체 재투영 강제 시 CatchUpRunner 커서 리셋 0으로 초기화 필요 */
```

### 버전 교체 코드 — `src/projection/projection.service.ts` (modifyFile)

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertResult, InsertService } from '@/insert/insert.service';
import { GripResultProjector } from '@/projection/projector/grip-result.projector';
import { MultiModalProjector } from '@/projection/projector/multimodal.projector';
import { GripOutlierProjector } from '@/projection/projector/grip-outlier.projector';
import { ProjectionResult } from '@/projection/projector/projector';
import { CatchUpRunner } from '@/projection/runner/catch-up.runner';
import { LogAction } from '@/shared/logger/logging-context';

export type CatchUpAllResult = {
  multimodal: ProjectionResult;
  gripResult: ProjectionResult;
};

export type InsertAndProjectionAllResult = {
  insert: InsertResult;
  projection: CatchUpAllResult;
};

@Injectable()
export class ProjectionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly runner: CatchUpRunner,
    private readonly multimodal: MultiModalProjector,
    private readonly gripResult: GripResultProjector,
    private readonly gripOutlierV2: GripOutlierProjector,
    private readonly insertService: InsertService,
  ) {
    this.logger.setContext(ProjectionService.name);
  }

  catchUpMultimodal(): Promise<ProjectionResult> {
    return this.runner.run(this.multimodal);
  }

  catchUpGripResult(): Promise<ProjectionResult> {
    return this.runner.run(this.gripResult);
  }

  catchUpGripOutlierV2(): Promise<ProjectionResult> {
    return this.runner.run(this.gripOutlierV2);
  }

  async catchUpAll(): Promise<CatchUpAllResult> {
    this.logger.info({ action: LogAction.PROJECTION_START }, "전체 투영 시작");

    const multimodal: ProjectionResult = await this.catchUpMultimodal();
    const gripResult: ProjectionResult = await this.catchUpGripResult();

    this.logger.info({ action: LogAction.PROJECTION_DONE }, "전체 투영 완료");

    return { multimodal, gripResult };
  }

  async insertAllAndProjectAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_START },
      "전체 적재+투영 시작",
    );

    const insert: InsertResult = await this.insertService.insertToyData();
    const projection: CatchUpAllResult = await this.catchUpAll();

    this.logger.info(
      { action: LogAction.PROJECTION_DONE },
      "전체 적재+투영 완료",
    );

    return { insert, projection };
  }
}
```

### 버전 교체 코드 — `src/projection/projection.controller.ts` (modifyFile)

```typescript
import { Controller, Post } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InsertAndProjectionAllResult, ProjectionService } from '@/projection/projection.service';
import { ProjectionResult } from '@/projection/projector/projector';
import { LogAction, LogContext } from '@/shared/logger/logging-context';

@Controller("projection")
export class ProjectionController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly projectionService: ProjectionService,
  ) {
    this.logger.setContext(ProjectionController.name);
  }

  @Post("/multimodal")
  multimodal(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/multimodal",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpMultimodal();
  }

  @Post("/grip-result")
  gripResult(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-result",
      },
      "projection 요청 수신",
    );

    return this.projectionService.catchUpGripResult();
  }

  @Post("/grip-outlier-v2")
  gripOutlierV2(): Promise<ProjectionResult> {
    this.logger.info(
      {
        action: LogAction.PROJECTION_REQUEST,
        [LogContext.ROUTE]: "POST /projection/grip-outlier-v2",
      },
      "v2 outlier projection 요청 수신",
    );

    return this.projectionService.catchUpGripOutlierV2();
  }

  @Post("/insert-all")
  insertAll(): Promise<InsertAndProjectionAllResult> {
    this.logger.info(
      { action: LogAction.PROJECTION_REQUEST },
      "projection 요청 수신",
    );

    return this.projectionService.insertAllAndProjectAll();
  }
}
```

## Guardrails (constraints)

- v1 자산(테이블/엔드포인트/프로젝터 name) 무손상
- PK (scene_key, attempt_num) 유지
- TypeScript any 금지
- 식별자 전체 단어
- DDL 실행·API 컷오버는 인간 승인 후에만 (human-in-the-loop)
- Read Model 테이블명은 read_ 접두 스네이크 케이스
<<<Docs 끝>>>

[채점 루브릭] 각 항목 1~5 정수
- groundedness (근거 충실성): Docs 가 인용한 값·필드·장면 번호·로그가 [자료]에 실제로 있는가. [저장소 파일 확인]에서 실재하는 파일의 경로·스키마·메서드 인용은 근거 없는 주장으로 보지 않는다. 존재하지 않는 파일이나 발췌와 다른 내용의 인용은 감점한다. 5=인용된 값·필드·장면이 모두 자료에 실재. 3=핵심 근거는 실재하나 일부 수치·부등호가 원문과 불일치. 1=근거 없는 주장이나 존재하지 않는 값의 인용이 결론을 좌우.
- diagnosisAccuracy (원인 진단 정확성): Docs 의 진단이 [정답 요지]와 일치하는가. 5=정답 원인과 유형·위치(필드, 장면, 처리 단계)까지 일치. 3=유형은 맞으나 위치나 메커니즘이 부정확. 1=오진이거나 원인을 특정하지 못함.
- actionability (실행 가능성): Docs 의 SQL 과 절차를 그대로 따르면 문제가 해결되는가. [자동 검증 결과]를 실측으로 반영하되, 실행이 되더라도 의도와 다른 일을 하는 SQL(조건이 한 건도 맞지 않는 삭제문, 요구한 컬럼이 없는 테이블 등)은 감점한다. 기존 v1 테이블(read_grip_result, read_multimodal, event_store)을 ALTER/DROP 하면 감점. 5=그대로 따르면 해결(실행 성공 + 요구 충족). 3=오탈자·순서 등 소폭 수정 후 해결. 1=따르면 실패하거나 기존 자산이 손상.
- completeness (완결성): 권고 문서, Read Model 생성 SQL, API 버저닝 세 요소가 모두 유효하고 서로 일치하는가(머리말·SQL 의 테이블명·권고 대상·코드가 서로 같은 것을 가리키는가). 5=세 요소가 모두 유효하고 서로 일치. 3=세 요소가 있으나 서로 어긋나거나 항목이 비어 있음. 1=요소 누락 또는 근거 부족 표시.

다음 형식의 JSON 객체 하나만 출력하라:
{"groundedness": 1-5, "diagnosisAccuracy": 1-5, "actionability": 1-5, "completeness": 1-5, "unsupportedClaims": ["자료에 없는 주장 인용 (없으면 빈 배열)"], "rationale": "각 항목 점수 근거를 항목당 1~2문장으로, 한국어로"}