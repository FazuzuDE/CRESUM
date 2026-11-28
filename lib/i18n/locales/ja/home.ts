export default {
  'home.today': '今日',
  'home.noAvailable': '利用できる種目を含むテンプレートがありません',
  'home.noTemplates': '利用できるワークアウトテンプレートがありません',
  'home.editTemplate':
    'プロフィールでテンプレートを編集し、利用できる種目を選んでください。',
  'home.createTemplate': 'プロフィールでテンプレートを作成して始めましょう。',
  'home.resume': '{{name}}を再開',
  'home.startNamed': '{{name}}を開始',
  'home.inProgress': '進行中',
  'home.quickStart': 'クイックスタート',
  'home.active': '進行中のワークアウト',
  'home.saved': '保存済みのワークアウト',
  'home.ready': 'ワークアウトを続ける準備ができています。',
  'home.planned': {
    other: '予定{{count, number}}セット',
  },
  'home.exercises': {
    other: '{{count, number}}種目',
  },
  'home.availability':
    '利用可能{{available, number}}・利用不可{{unavailable, number}}',
  'home.fourWeeks': '過去4週間',
  'home.completed': {
    other: '完了したワークアウト{{count, number}}回',
  },
  'home.local': '・端末に保存済み',
  'home.totalVolume': '総トレーニング量',
  'home.tonnes': '{{value}} t',
  'home.kilograms': '{{value}} kg',
  'home.week': '今週の予定',
  'home.workouts': {
    other: 'ワークアウト{{count, number}}回',
  },
  'home.month': '月',
  'home.openCalendar': '月間カレンダーを開く',
  'home.day': '{{date}}：{{completed}}',
  'home.dayToday': '{{date}}：{{completed}}、今日',
  'home.last': '前回のワークアウト',
  'home.volume': 'トレーニング量{{value}} kg',
  'home.empty':
    '完了したワークアウトはまだありません。1回完了すると最近のトレーニングが表示されます。',
  'home.templates': 'ワークアウトテンプレート',
  'home.moreTemplates': '他のテンプレート',
  'home.finishFirst':
    '別のワークアウトを始めるには、現在のワークアウトを終了してください。',
  'home.finishHint':
    '別のワークアウトを始める前に、現在のワークアウトを終了してください。',
  'home.start': '開始',
  'home.welcomeNamed': 'おかえりなさい、{{name}}さん！',
  'home.welcomeBack': 'おかえりなさい',
  'home.welcome': 'ようこそ',
  'home.greeting': '今日も一歩、前へ。',
  'home.openProfile': 'プロフィールを開く',
  'home.customize': 'ホームをカスタマイズ',
  'home.loadError':
    'ホームのレイアウトを読み込めませんでした。標準のブロックを表示しています。ワークアウトは引き続き利用できます。',
  'home.retry': 'レイアウトを再読み込み',
  'home.reset': 'ホームのレイアウトをリセット',
  'home.saveError':
    'ホームのレイアウトを保存できませんでした。再試行してください。',
  'home.editHint':
    'ブロックを長押ししてドラッグすると移動できます。完了を選ぶと保存します。',
  'home.cancel': 'キャンセル',
  'home.saving': 'レイアウトを保存中…',
  'home.done': '完了',
  'home.order': '順序と表示',
  'home.saveDraftError':
    'ホームのレイアウトを保存できませんでした。もう一度完了を選ぶか、キャンセルしてください。',
  'home.editorIntro':
    '表示するブロックと順序を選んでください。ワークアウトの操作は常に表示されます。',
  'home.widget.week': '今週の予定',
  'home.widget.primary': 'ワークアウトを開始／再開',
  'home.widget.summary': 'トレーニングの概要',
  'home.widget.latest': '直近のワークアウト',
  'home.widget.templates': '他のワークアウト',
  'home.moveUp': '{{label}}を上へ移動',
  'home.moveDown': '{{label}}を下へ移動',
  'home.always': '常に表示',
  'home.shown': '表示中',
  'home.hidden': '非表示',
  'home.show': '{{label}}を表示',
  'home.storage':
    'この端末に保存されます。一部のブロックはデータがあるときだけ表示されます。ワークアウトのデータをリセットしてもホームのレイアウトは残りますが、バックアップファイルやクラウド同期には含まれません。',
  'home.editorError':
    'ホームのレイアウトを保存できませんでした。再試行するかキャンセルしてください。',
  'home.saveLayout': 'レイアウトを保存',
  'home.restoreOrder': '標準の順序に戻す',
  'home.editAnnounce':
    'ホームを編集中です。ブロックを移動し、完了またはキャンセルを選んでください。',
  'home.moved':
    'ブロックを{{total, number}}個中{{index, number}}番目に移動しました。',
  'home.position': '{{label}}、{{total, number}}個中{{index, number}}番目',
  'home.dragHint':
    '長押ししてドラッグすると並べ替えできます。ボタン操作は順序と表示を使ってください。',
  'calendar.title': 'カレンダー',
  'calendar.close': 'カレンダーを閉じる',
  'calendar.empty': 'この日に完了したワークアウトはありません。',
  'calendar.session': '{{time}}・{{volume}}',
  'calendar.previous': '前の月',
  'calendar.next': '次の月',
  'calendar.legend': '青い日付：完了したワークアウト',
} as const;
