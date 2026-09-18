export const QUESTIONS = [
  {
    id: "Q001", questionText: "Who approved the revised budget?", questionJa: "誰が修正予算を承認しましたか？", difficulty: "standard", category: "Who", correctChoice: "B",
    choices: [
      { key: "A", text: "At the monthly meeting.", ja: "月例会議でです。" },
      { key: "B", text: "Ms. Patel did.", ja: "パテルさんです。" },
      { key: "C", text: "It was revised yesterday.", ja: "昨日修正されました。" }
    ], explanation: "Whoへの応答なので、人物を示す “Ms. Patel did.” が適切です。"
  },
  {
    id: "Q002", questionText: "Where should I leave these packages?", questionJa: "この荷物はどこに置けばよいですか？", difficulty: "standard", category: "Where", correctChoice: "A",
    choices: [
      { key: "A", text: "Beside the reception desk.", ja: "受付机の横です。" },
      { key: "B", text: "They arrived this morning.", ja: "今朝届きました。" },
      { key: "C", text: "About five kilograms.", ja: "約5キロです。" }
    ], explanation: "Whereには場所を答えるAが自然です。"
  },
  {
    id: "Q003", questionText: "When does the express train depart?", questionJa: "急行列車はいつ出発しますか？", difficulty: "standard", category: "When", correctChoice: "C",
    choices: [
      { key: "A", text: "From platform six.", ja: "6番ホームからです。" },
      { key: "B", text: "It is usually crowded.", ja: "たいてい混雑しています。" },
      { key: "C", text: "In about ten minutes.", ja: "あと10分ほどです。" }
    ], explanation: "Whenへの時間表現 “In about ten minutes.” が正答です。"
  },
  {
    id: "Q004", questionText: "Why was the conference room changed?", questionJa: "なぜ会議室が変更されたのですか？", difficulty: "standard", category: "Why", correctChoice: "B",
    choices: [
      { key: "A", text: "On the third floor.", ja: "3階です。" },
      { key: "B", text: "The original room was too small.", ja: "元の部屋が狭すぎたからです。" },
      { key: "C", text: "For nearly two hours.", ja: "2時間近くです。" }
    ], explanation: "Whyには理由を述べるBが対応します。"
  },
  {
    id: "Q005", questionText: "How do I connect to the guest network?", questionJa: "ゲスト用ネットワークにはどう接続しますか？", difficulty: "standard", category: "How", correctChoice: "A",
    choices: [
      { key: "A", text: "Enter the password on this card.", ja: "このカードのパスワードを入力してください。" },
      { key: "B", text: "The connection is stable.", ja: "接続は安定しています。" },
      { key: "C", text: "A guest from Toronto.", ja: "トロントからの来客です。" }
    ], explanation: "Howは方法を尋ねており、操作方法を示すAが正答です。"
  },
  {
    id: "Q006", questionText: "Did you send the invoice to the client?", questionJa: "顧客に請求書を送りましたか？", difficulty: "standard", category: "Yes / No", correctChoice: "C",
    choices: [
      { key: "A", text: "The client’s new office.", ja: "顧客の新しい事務所です。" },
      { key: "B", text: "It lists three items.", ja: "3項目載っています。" },
      { key: "C", text: "Yes, I e-mailed it before lunch.", ja: "はい、昼食前にメールしました。" }
    ], explanation: "Yes/No疑問に、送付済みだと直接答えるCが適切です。"
  },
  {
    id: "Q007", questionText: "What time is your appointment?", questionJa: "予約は何時ですか？", difficulty: "standard", category: "What", correctChoice: "B",
    choices: [
      { key: "A", text: "With Dr. Lee.", ja: "リー先生とです。" },
      { key: "B", text: "At two thirty.", ja: "2時30分です。" },
      { key: "C", text: "I made it online.", ja: "オンラインで予約しました。" }
    ], explanation: "What timeには具体的な時刻を答えるBが正答です。"
  },
  {
    id: "Q008", questionText: "Could you print two copies of this report?", questionJa: "この報告書を2部印刷してもらえますか？", difficulty: "standard", category: "Request", correctChoice: "A",
    choices: [
      { key: "A", text: "Sure, I’ll do it now.", ja: "もちろん、今やります。" },
      { key: "B", text: "The report was interesting.", ja: "報告書は興味深かったです。" },
      { key: "C", text: "Two pages were missing.", ja: "2ページ不足していました。" }
    ], explanation: "依頼を引き受けるAが自然な応答です。"
  },
  {
    id: "Q009", questionText: "Would you like to join us for dinner?", questionJa: "夕食をご一緒しませんか？", difficulty: "standard", category: "Suggestion", correctChoice: "C",
    choices: [
      { key: "A", text: "The restaurant closes at nine.", ja: "レストランは9時に閉まります。" },
      { key: "B", text: "I joined the company last year.", ja: "昨年入社しました。" },
      { key: "C", text: "I’d love to, thanks.", ja: "ぜひ、ありがとう。" }
    ], explanation: "誘いを快く受けるCが自然です。"
  },
  {
    id: "Q010", questionText: "Which design do you prefer, the blue one or the green one?", questionJa: "青と緑、どちらのデザインが好みですか？", difficulty: "standard", category: "Choice", correctChoice: "B",
    choices: [
      { key: "A", text: "The designer works upstairs.", ja: "デザイナーは上の階で働いています。" },
      { key: "B", text: "The blue one looks more professional.", ja: "青のほうがよりプロらしく見えます。" },
      { key: "C", text: "We ordered twenty copies.", ja: "20部注文しました。" }
    ], explanation: "二択に対して一方を選ぶBが正答です。"
  },
  {
    id: "Q011", questionText: "Where can I find the warranty information?", questionJa: "保証情報はどこで確認できますか？", difficulty: "standard", category: "Where", correctChoice: "C",
    choices: [
      { key: "A", text: "It lasts for two years.", ja: "2年間有効です。" },
      { key: "B", text: "I bought it last week.", ja: "先週買いました。" },
      { key: "C", text: "It’s on the last page of the manual.", ja: "説明書の最終ページにあります。" }
    ], explanation: "情報の所在を答えるCが適切です。"
  },
  {
    id: "Q012", questionText: "Aren’t you attending the workshop tomorrow?", questionJa: "明日の研修会には参加しないのですか？", difficulty: "standard", category: "Negative question", correctChoice: "A",
    choices: [
      { key: "A", text: "No, I have a client visit instead.", ja: "はい、代わりに顧客訪問があります。" },
      { key: "B", text: "The workshop was useful.", ja: "研修会は役立ちました。" },
      { key: "C", text: "Tomorrow’s forecast is sunny.", ja: "明日の予報は晴れです。" }
    ], explanation: "否定疑問でも内容で判断します。参加しない理由を示すAが自然です。"
  },
  {
    id: "Q013", questionText: "How often is the equipment inspected?", questionJa: "その設備はどのくらいの頻度で点検されますか？", difficulty: "standard", category: "How", correctChoice: "B",
    choices: [
      { key: "A", text: "By a certified technician.", ja: "認定技術者によってです。" },
      { key: "B", text: "Every three months.", ja: "3か月ごとです。" },
      { key: "C", text: "It passed the inspection.", ja: "点検に合格しました。" }
    ], explanation: "How oftenには頻度を答えるBが対応します。"
  },
  {
    id: "Q014", questionText: "I left the sales figures on your desk.", questionJa: "売上データを机の上に置きました。", difficulty: "standard", category: "Statement", correctChoice: "C",
    choices: [
      { key: "A", text: "The desk is made of wood.", ja: "机は木製です。" },
      { key: "B", text: "Sales begin next Monday.", ja: "セールは次の月曜日に始まります。" },
      { key: "C", text: "Thanks, I’ll review them this afternoon.", ja: "ありがとう、午後に確認します。" }
    ], explanation: "平叙文への応答として、受領と次の行動を示すCが自然です。"
  },
  {
    id: "Q015", questionText: "When will the replacement parts arrive?", questionJa: "交換部品はいつ届きますか？", difficulty: "standard", category: "When", correctChoice: "A",
    choices: [
      { key: "A", text: "They’re expected on Friday.", ja: "金曜日に到着予定です。" },
      { key: "B", text: "The broken parts are here.", ja: "壊れた部品はここにあります。" },
      { key: "C", text: "By express delivery.", ja: "速達便でです。" }
    ], explanation: "到着時期を答えるAが正答です。"
  },
  {
    id: "Q016", questionText: "Can I borrow your charger for a moment?", questionJa: "少し充電器を借りてもいいですか？", difficulty: "standard", category: "Request", correctChoice: "B",
    choices: [
      { key: "A", text: "My phone is fully charged.", ja: "私の携帯は充電済みです。" },
      { key: "B", text: "Of course, it’s in my bag.", ja: "もちろん、かばんの中です。" },
      { key: "C", text: "For about an hour.", ja: "1時間ほどです。" }
    ], explanation: "許可を与え、場所も伝えるBが最も自然です。"
  },
  {
    id: "Q017", questionText: "Who is leading the orientation session?", questionJa: "オリエンテーションは誰が担当しますか？", difficulty: "standard", category: "Who", correctChoice: "A",
    choices: [
      { key: "A", text: "Our human resources manager.", ja: "人事部長です。" },
      { key: "B", text: "In the training room.", ja: "研修室です。" },
      { key: "C", text: "It starts after lunch.", ja: "昼食後に始まります。" }
    ], explanation: "Whoに人物・役職を答えるAが正答です。"
  },
  {
    id: "Q018", questionText: "Why don’t we move the display closer to the entrance?", questionJa: "展示を入口の近くに移しませんか？", difficulty: "standard", category: "Suggestion", correctChoice: "C",
    choices: [
      { key: "A", text: "The entrance is automatic.", ja: "入口は自動式です。" },
      { key: "B", text: "It was displayed last month.", ja: "先月展示されました。" },
      { key: "C", text: "Good idea—it’ll be easier to notice.", ja: "いいですね、目につきやすくなります。" }
    ], explanation: "Why don’t we ...? は提案。賛同するCが自然です。"
  },
  {
    id: "Q019", questionText: "Do you want the receipt printed or e-mailed?", questionJa: "領収書は印刷とメール、どちらがよいですか？", difficulty: "standard", category: "Choice", correctChoice: "B",
    choices: [
      { key: "A", text: "Yes, I kept the receipt.", ja: "はい、領収書を保管しました。" },
      { key: "B", text: "E-mail would be better.", ja: "メールのほうがよいです。" },
      { key: "C", text: "The printer needs paper.", ja: "プリンターに紙が必要です。" }
    ], explanation: "選択疑問はYes/Noでなく、選択肢を答えるBが正答です。"
  },
  {
    id: "Q020", questionText: "What caused the delay in production?", questionJa: "生産の遅れの原因は何でしたか？", difficulty: "standard", category: "What", correctChoice: "A",
    choices: [
      { key: "A", text: "A shipment of materials arrived late.", ja: "材料の出荷が遅れて届きました。" },
      { key: "B", text: "Production increased by ten percent.", ja: "生産は10％増加しました。" },
      { key: "C", text: "At the main factory.", ja: "主工場でです。" }
    ], explanation: "原因を具体的に述べるAが正答です。"
  },
  {
    id: "Q021", questionText: "Has the venue confirmed our reservation yet?", questionJa: "会場はもう予約を確定しましたか？", difficulty: "advanced", category: "Yes / No", correctChoice: "C",
    choices: [
      { key: "A", text: "The venue seats two hundred.", ja: "会場は200席あります。" },
      { key: "B", text: "I reserved a table for six.", ja: "6人用の席を予約しました。" },
      { key: "C", text: "I’m still waiting for their reply.", ja: "まだ返事を待っています。" }
    ], explanation: "直接Yes/Noを言わなくても、未確定だと示すCが適切です。"
  },
  {
    id: "Q022", questionText: "Where did you put the signed contract?", questionJa: "署名済み契約書をどこに置きましたか？", difficulty: "advanced", category: "Where", correctChoice: "B",
    choices: [
      { key: "A", text: "The lawyer signed it.", ja: "弁護士が署名しました。" },
      { key: "B", text: "Check the blue folder in my cabinet.", ja: "私の棚の青いフォルダーを見てください。" },
      { key: "C", text: "It needs another signature.", ja: "もう一つ署名が必要です。" }
    ], explanation: "場所を直接言わず、探す場所を示すBが自然な間接応答です。"
  },
  {
    id: "Q023", questionText: "Why is Mr. Gomez taking the later flight?", questionJa: "なぜゴメスさんは遅い便に乗るのですか？", difficulty: "advanced", category: "Why", correctChoice: "A",
    choices: [
      { key: "A", text: "His morning meeting was extended.", ja: "午前の会議が延長されたからです。" },
      { key: "B", text: "The flight takes four hours.", ja: "飛行時間は4時間です。" },
      { key: "C", text: "He prefers an aisle seat.", ja: "彼は通路側の席を好みます。" }
    ], explanation: "後の便に変更した理由を示すAが正答です。"
  },
  {
    id: "Q024", questionText: "You’ve updated the inventory list, haven’t you?", questionJa: "在庫一覧を更新しましたよね？", difficulty: "advanced", category: "Tag question", correctChoice: "C",
    choices: [
      { key: "A", text: "The inventory is in the warehouse.", ja: "在庫は倉庫にあります。" },
      { key: "B", text: "We list products alphabetically.", ja: "商品はアルファベット順に載せます。" },
      { key: "C", text: "Not yet, but it’s next on my list.", ja: "まだですが、次に取りかかります。" }
    ], explanation: "付加疑問への自然な応答。未完了と次の予定を示すCが適切です。"
  },
  {
    id: "Q025", questionText: "How did the product demonstration go?", questionJa: "製品デモはどうでしたか？", difficulty: "advanced", category: "How", correctChoice: "B",
    choices: [
      { key: "A", text: "We demonstrated three products.", ja: "3製品を実演しました。" },
      { key: "B", text: "The audience asked a lot of good questions.", ja: "聴衆から良い質問がたくさん出ました。" },
      { key: "C", text: "It went to the marketing team.", ja: "マーケティング部に渡りました。" }
    ], explanation: "How did ... go? は結果・感想を尋ねます。Bが自然です。"
  },
  {
    id: "Q026", questionText: "Should we order more chairs for the seminar?", questionJa: "セミナー用に椅子を追加注文すべきですか？", difficulty: "advanced", category: "Suggestion", correctChoice: "A",
    choices: [
      { key: "A", text: "Registration has already exceeded our estimate.", ja: "申込数はすでに予想を上回っています。" },
      { key: "B", text: "The chairs were arranged in rows.", ja: "椅子は列に並べられました。" },
      { key: "C", text: "The seminar lasted all day.", ja: "セミナーは終日続きました。" }
    ], explanation: "直接Yesと言わず、追加注文が必要な根拠を示すAが正答です。"
  },
  {
    id: "Q027", questionText: "When is the maintenance team expected?", questionJa: "保守チームはいつ来る予定ですか？", difficulty: "advanced", category: "When", correctChoice: "C",
    choices: [
      { key: "A", text: "They fixed the elevator.", ja: "彼らがエレベーターを修理しました。" },
      { key: "B", text: "The team has four members.", ja: "チームは4人です。" },
      { key: "C", text: "They said sometime before noon.", ja: "正午前のどこかだと言っていました。" }
    ], explanation: "厳密な時刻でなくても、到着予定時間を示すCが適切です。"
  },
  {
    id: "Q028", questionText: "Couldn’t we postpone the launch until Monday?", questionJa: "発売を月曜日まで延期できませんか？", difficulty: "advanced", category: "Negative question", correctChoice: "B",
    choices: [
      { key: "A", text: "Monday was a holiday.", ja: "月曜日は祝日でした。" },
      { key: "B", text: "The advertising campaign is already scheduled.", ja: "広告キャンペーンがすでに予定されています。" },
      { key: "C", text: "We launched two products.", ja: "2製品を発売しました。" }
    ], explanation: "延期案に対し、難しい理由を間接的に示すBが自然です。"
  },
  {
    id: "Q029", questionText: "Who should I contact about travel reimbursement?", questionJa: "出張旅費の精算は誰に連絡すればよいですか？", difficulty: "advanced", category: "Who", correctChoice: "A",
    choices: [
      { key: "A", text: "Nina handles all expense claims.", ja: "ニナが経費申請をすべて担当しています。" },
      { key: "B", text: "The trip was reimbursed.", ja: "出張費は精算されました。" },
      { key: "C", text: "Contactless payment is accepted.", ja: "非接触決済が使えます。" }
    ], explanation: "担当者を示すAが正答です。contactの音に引かれないことが重要です。"
  },
  {
    id: "Q030", questionText: "The copier is making that noise again.", questionJa: "コピー機がまたあの音を立てています。", difficulty: "advanced", category: "Statement", correctChoice: "C",
    choices: [
      { key: "A", text: "I made twenty copies.", ja: "20部コピーしました。" },
      { key: "B", text: "The office is noisy today.", ja: "今日は事務所が騒がしいです。" },
      { key: "C", text: "I’ll call the service technician.", ja: "修理担当者に連絡します。" }
    ], explanation: "状況への対応を示すCが自然です。音の似たcopy/copiesは誤答誘導です。"
  },
  {
    id: "Q031", questionText: "What did the consultant recommend?", questionJa: "コンサルタントは何を勧めましたか？", difficulty: "advanced", category: "What", correctChoice: "B",
    choices: [
      { key: "A", text: "We met in the conference room.", ja: "会議室で会いました。" },
      { key: "B", text: "Reducing the number of approval steps.", ja: "承認段階を減らすことです。" },
      { key: "C", text: "Her recommendation was detailed.", ja: "彼女の提案は詳細でした。" }
    ], explanation: "勧告の内容を具体的に答えるBが正答です。"
  },
  {
    id: "Q032", questionText: "Would you rather meet online or in person?", questionJa: "オンラインと対面、どちらで会いたいですか？", difficulty: "advanced", category: "Choice", correctChoice: "A",
    choices: [
      { key: "A", text: "Either works for me.", ja: "どちらでも大丈夫です。" },
      { key: "B", text: "I met her once before.", ja: "以前一度会いました。" },
      { key: "C", text: "The website is online.", ja: "ウェブサイトは公開中です。" }
    ], explanation: "選択疑問では「どちらでもよい」という応答も成立します。"
  },
  {
    id: "Q033", questionText: "Why hasn’t the lobby display been installed?", questionJa: "なぜロビーの展示はまだ設置されていないのですか？", difficulty: "advanced", category: "Why", correctChoice: "C",
    choices: [
      { key: "A", text: "Visitors wait in the lobby.", ja: "来客はロビーで待ちます。" },
      { key: "B", text: "The display is very bright.", ja: "展示はとても明るいです。" },
      { key: "C", text: "We’re waiting for the mounting brackets.", ja: "取付金具を待っているところです。" }
    ], explanation: "未設置の理由を示すCが正答です。"
  },
  {
    id: "Q034", questionText: "Do you know when Ms. Chen will return?", questionJa: "チェンさんがいつ戻るか知っていますか？", difficulty: "advanced", category: "Indirect question", correctChoice: "B",
    choices: [
      { key: "A", text: "Yes, I know Ms. Chen.", ja: "はい、チェンさんを知っています。" },
      { key: "B", text: "Her calendar says Thursday.", ja: "予定表では木曜日です。" },
      { key: "C", text: "She returned the document.", ja: "彼女は書類を返しました。" }
    ], explanation: "Do you knowだけでなく、埋め込まれたwhenの内容に答えるBが正答です。"
  },
  {
    id: "Q035", questionText: "How many applicants have we interviewed so far?", questionJa: "これまで何人の応募者と面接しましたか？", difficulty: "advanced", category: "How", correctChoice: "A",
    choices: [
      { key: "A", text: "I believe today’s candidate was the sixth.", ja: "今日の候補者が6人目だったと思います。" },
      { key: "B", text: "The interviews went well.", ja: "面接はうまくいきました。" },
      { key: "C", text: "So far, no one has applied.", ja: "今のところ誰も応募していません。" }
    ], explanation: "人数を間接的に示すAが適切です。"
  },
  {
    id: "Q036", questionText: "Isn’t this invoice due by the end of the month?", questionJa: "この請求書は月末までが期限ではないですか？", difficulty: "advanced", category: "Negative question", correctChoice: "C",
    choices: [
      { key: "A", text: "It includes the delivery fee.", ja: "配送料が含まれています。" },
      { key: "B", text: "The month has thirty days.", ja: "今月は30日あります。" },
      { key: "C", text: "The supplier granted us an extension.", ja: "仕入先が期限延長を認めてくれました。" }
    ], explanation: "期限への認識に対し、状況が変わったことを示すCが自然です。"
  },
  {
    id: "Q037", questionText: "Why don’t you take the company shuttle?", questionJa: "会社のシャトルバスを使ってはどうですか？", difficulty: "advanced", category: "Suggestion", correctChoice: "B",
    choices: [
      { key: "A", text: "The company moved downtown.", ja: "会社は中心街へ移転しました。" },
      { key: "B", text: "It doesn’t run early enough for my shift.", ja: "私の勤務時間に間に合うほど早く運行していません。" },
      { key: "C", text: "I took the documents upstairs.", ja: "書類を上階へ持っていきました。" }
    ], explanation: "提案を採用できない理由を示すBが適切です。"
  },
  {
    id: "Q038", questionText: "Can you finish the draft before the review meeting?", questionJa: "レビュー会議前に草案を仕上げられますか？", difficulty: "advanced", category: "Request", correctChoice: "A",
    choices: [
      { key: "A", text: "If I get the data from accounting today.", ja: "今日経理からデータをもらえれば。" },
      { key: "B", text: "The meeting finished early.", ja: "会議は早く終わりました。" },
      { key: "C", text: "I reviewed the first draft.", ja: "初稿を確認しました。" }
    ], explanation: "条件付きで可能だと答えるAが自然です。"
  },
  {
    id: "Q039", questionText: "There’s a package for you at reception.", questionJa: "受付にあなた宛ての荷物があります。", difficulty: "advanced", category: "Statement", correctChoice: "C",
    choices: [
      { key: "A", text: "The reception starts at seven.", ja: "歓迎会は7時に始まります。" },
      { key: "B", text: "We offer several packages.", ja: "複数のパッケージを提供しています。" },
      { key: "C", text: "I’ll pick it up on my way out.", ja: "帰る途中で受け取ります。" }
    ], explanation: "荷物の知らせに対する次の行動を示すCが適切です。"
  },
  {
    id: "Q040", questionText: "Which branch exceeded its sales target?", questionJa: "どの支店が売上目標を上回りましたか？", difficulty: "advanced", category: "Which", correctChoice: "B",
    choices: [
      { key: "A", text: "The target was ambitious.", ja: "目標は意欲的でした。" },
      { key: "B", text: "The one near Central Station.", ja: "中央駅近くの支店です。" },
      { key: "C", text: "Sales figures are confidential.", ja: "売上数値は機密です。" }
    ], explanation: "Which branchへの特定表現 “The one ...” が正答です。"
  },
  {
    id: "Q041", questionText: "Who was supposed to brief the new contractors?", questionJa: "新しい契約スタッフへの説明は誰の担当でしたか？", difficulty: "expert", category: "Who", correctChoice: "A",
    choices: [
      { key: "A", text: "I thought operations had assigned someone.", ja: "業務部が誰かを割り当てたと思っていました。" },
      { key: "B", text: "The contract is fairly brief.", ja: "契約書はかなり短いです。" },
      { key: "C", text: "They started contracting last month.", ja: "彼らは先月契約を始めました。" }
    ], explanation: "担当者を直接特定せず、割当元への認識を示す高度な間接応答です。"
  },
  {
    id: "Q042", questionText: "Haven’t the revised guidelines been circulated?", questionJa: "改訂版ガイドラインはまだ回覧されていないのですか？", difficulty: "expert", category: "Negative question", correctChoice: "C",
    choices: [
      { key: "A", text: "The circulation desk is downstairs.", ja: "貸出カウンターは下の階です。" },
      { key: "B", text: "We revised three sections.", ja: "3つの節を改訂しました。" },
      { key: "C", text: "Legal asked us to hold off until tomorrow.", ja: "法務部から明日まで待つよう言われました。" }
    ], explanation: "未回覧の理由を示すCが自然です。circulatedの別義に注意。"
  },
  {
    id: "Q043", questionText: "When did the board decide to expand the warehouse?", questionJa: "取締役会はいつ倉庫拡張を決めましたか？", difficulty: "expert", category: "When", correctChoice: "B",
    choices: [
      { key: "A", text: "The warehouse is being expanded.", ja: "倉庫は拡張中です。" },
      { key: "B", text: "That was approved at last quarter’s meeting.", ja: "前四半期の会議で承認されました。" },
      { key: "C", text: "The board is made of oak.", ja: "板はオーク材です。" }
    ], explanation: "決定時期を間接的に示すBが正答。boardの同音・多義語が誘導です。"
  },
  {
    id: "Q044", questionText: "Wouldn’t the earlier proposal be more cost-effective?", questionJa: "以前の提案のほうが費用対効果が高いのでは？", difficulty: "expert", category: "Negative question", correctChoice: "A",
    choices: [
      { key: "A", text: "Only if material prices remain stable.", ja: "材料価格が安定したままなら、です。" },
      { key: "B", text: "The proposal came in early.", ja: "提案は早く届きました。" },
      { key: "C", text: "Costs were entered in the spreadsheet.", ja: "費用は表計算に入力されました。" }
    ], explanation: "条件付きで同意するAが、高度だが自然な応答です。"
  },
  {
    id: "Q045", questionText: "How are we going to accommodate the extra attendees?", questionJa: "追加の参加者にはどう対応しますか？", difficulty: "expert", category: "How", correctChoice: "C",
    choices: [
      { key: "A", text: "Attendance was higher last year.", ja: "昨年の参加者数はもっと多かったです。" },
      { key: "B", text: "The hotel has comfortable accommodations.", ja: "ホテルには快適な宿泊施設があります。" },
      { key: "C", text: "Facilities is opening the adjoining room.", ja: "施設管理部が隣室を開ける予定です。" }
    ], explanation: "具体的な対応策を示すCが正答です。accommodate/accommodationsの音に注意。"
  },
  {
    id: "Q046", questionText: "Why was the regional manager left off the distribution list?", questionJa: "なぜ地域マネージャーが配布先一覧から外されたのですか？", difficulty: "expert", category: "Why", correctChoice: "B",
    choices: [
      { key: "A", text: "She manages the western region.", ja: "彼女は西部地域を担当しています。" },
      { key: "B", text: "I assumed her assistant would forward it.", ja: "アシスタントが転送すると思っていました。" },
      { key: "C", text: "The list was distributed yesterday.", ja: "一覧は昨日配布されました。" }
    ], explanation: "除外した理由となる思い込みを説明するBが正答です。"
  },
  {
    id: "Q047", questionText: "Do we have enough samples for both presentations?", questionJa: "両方のプレゼンに十分なサンプルがありますか？", difficulty: "expert", category: "Yes / No", correctChoice: "A",
    choices: [
      { key: "A", text: "More are being delivered this afternoon.", ja: "午後に追加分が届きます。" },
      { key: "B", text: "Both presenters are experienced.", ja: "両方の発表者は経験豊富です。" },
      { key: "C", text: "The sample presentation was brief.", ja: "見本のプレゼンは短かったです。" }
    ], explanation: "現時点の不足を直接言わず、補充予定を伝えるAが最も自然です。"
  },
  {
    id: "Q048", questionText: "Which estimate did the client base the decision on?", questionJa: "顧客はどの見積もりに基づいて決定しましたか？", difficulty: "expert", category: "Which", correctChoice: "C",
    choices: [
      { key: "A", text: "The decision was announced today.", ja: "決定は今日発表されました。" },
      { key: "B", text: "We estimate a two-week delay.", ja: "2週間の遅れと見積もっています。" },
      { key: "C", text: "Apparently, they used the preliminary figures.", ja: "どうやら暫定値を使ったようです。" }
    ], explanation: "どの見積もりかを “preliminary figures” で特定するCが正答です。"
  },
  {
    id: "Q049", questionText: "I expected the audit to take considerably longer.", questionJa: "監査にはもっとずっと時間がかかると思っていました。", difficulty: "expert", category: "Statement", correctChoice: "B",
    choices: [
      { key: "A", text: "The auditorium is across the hall.", ja: "講堂は廊下の向かいです。" },
      { key: "B", text: "So did I, but the records were well organized.", ja: "私もです。でも記録がよく整理されていました。" },
      { key: "C", text: "We hired a long-term employee.", ja: "長期雇用の社員を採用しました。" }
    ], explanation: "予想への同意と、早く終わった理由を返すBが自然です。"
  },
  {
    id: "Q050", questionText: "Could you tell me whether the permit covers weekend deliveries?", questionJa: "その許可が週末の配送も対象か教えてもらえますか？", difficulty: "expert", category: "Indirect question", correctChoice: "A",
    choices: [
      { key: "A", text: "I’ll need to check the conditions attached to it.", ja: "付帯条件を確認する必要があります。" },
      { key: "B", text: "The delivery driver has a permit.", ja: "配送運転手は許可証を持っています。" },
      { key: "C", text: "Weekends are usually quieter.", ja: "週末はたいてい静かです。" }
    ], explanation: "即答できないため確認すると伝えるAが、自然な間接応答です。"
  }
];

export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));
