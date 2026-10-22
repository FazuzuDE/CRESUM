import { flattenTechniqueText } from '../../technique-text';
export default flattenTechniqueText({
  'barbell-bench-press': {
    scope: 'Banc horizontal ; barre.',
    setup: [
      'Règle les supports et les sécurités ; demande une assistance pour les charges exigeantes. Allonge-toi, pieds en appui et barre au-dessus des yeux.',
    ],
    movement: [
      'Prends une prise fermée un peu plus large que les épaules. Descends avec contrôle vers le milieu de la poitrine puis pousse vers le haut.',
    ],
    checks: [
      'Garde les poignets au-dessus des avant-bras, les épaules et les hanches en appui. Expire en poussant.',
    ],
    mistakes: [
      'Rebond de la barre : descends doucement.',
      'Hanches décollées : garde le contact avec le banc.',
      'Poignets cassés : aligne-les sur les avant-bras.',
    ],
  },
  'incline-dumbbell-press': {
    scope: 'Banc incliné ; deux haltères.',
    setup: [
      'Règle une inclinaison stable et garde les deux pieds en appui ; place les haltères de chaque côté du haut de la poitrine.',
    ],
    movement: [
      'Pousse les deux charges simultanément vers le haut puis descends lentement à une profondeur confortable.',
    ],
    checks: [
      'Garde les poignets au-dessus des coudes, la tête, les épaules et les hanches sur le banc.',
    ],
    mistakes: [
      'Cambrure excessive : gaine le tronc.',
      'Descente asymétrique : déplace les charges ensemble.',
      'Profondeur forcée : réduis l’amplitude.',
    ],
  },
  'dumbbell-bench-press': {
    scope: 'Banc horizontal ; deux haltères.',
    setup: [
      'Allonge-toi avec les pieds en appui ; tiens les haltères près de la poitrine avec une prise fermée sûre.',
    ],
    movement: [
      'Pousse vers le haut simultanément ; descends avec contrôle en soutenant les charges par les avant-bras.',
    ],
    checks: [
      'Aligne les poignets et garde les épaules en appui. Expire en poussant.',
    ],
    mistakes: [
      'Haltères qui se heurtent : laisse un espace.',
      'Charges qui tombent : contrôle la descente.',
      'Hanches décollées : maintiens le contact.',
    ],
  },
  'machine-chest-press': {
    scope: 'Presse à poitrine assise ; la géométrie des poignées varie.',
    setup: [
      'Règle le siège pour placer les poignées environ au milieu de la poitrine. Garde le dos en appui et les pieds stables.',
    ],
    movement: [
      'Pousse régulièrement vers l’avant ; reviens sans laisser les plaques s’entrechoquer.',
    ],
    checks: [
      'Utilise une prise fermée, des poignets alignés et une amplitude confortable et contrôlée.',
    ],
    mistakes: [
      'Siège trop bas : règle la hauteur.',
      'Épaules décollées du dossier : réduis la portée.',
      'Verrouillage brutal des coudes : termine doucement.',
    ],
  },
  'cable-chest-fly': {
    scope: 'Écarté aux poulies debout ; l’angle des câbles dépend du réglage.',
    setup: [
      'Tiens-toi stable entre deux poulies réglées de la même façon ; prends les poignées avec les coudes légèrement fléchis.',
    ],
    movement: [
      'Ramène les bras en arc vers l’avant jusqu’à rapprocher les mains ; reviens lentement.',
    ],
    checks: [
      'Maintiens la flexion des coudes et le tronc stable ; ne force pas les bras derrière toi.',
    ],
    mistakes: [
      'Transformation en développé : garde l’angle des coudes.',
      'Balancement : réduis la charge.',
      'Croisement excessif : termine sans heurter les mains.',
    ],
    adaptation:
      'Résumé de l’écarté aux poulies à partir du crossover de la source ; dépasser la ligne médiane n’est pas nécessaire.',
  },
  'pec-deck-fly': {
    scope:
      'Pec deck assis ; les versions à poignées et à appuis pour avant-bras diffèrent.',
    setup: [
      'Règle le siège pour aligner confortablement les bras de l’appareil avec la poitrine et les épaules ; soutiens le dos et les pieds.',
    ],
    movement: [
      'Rapproche doucement les coussins ou les poignées puis reviens avec contrôle.',
    ],
    checks: [
      'Suis les indications de l’appareil ; évite un étirement forcé des épaules.',
    ],
    mistakes: [
      'Dos décollé du dossier : garde l’appui.',
      'Épaules haussées : réduis la charge.',
      'À-coups sur les plaques : ralentis le retour.',
    ],
    adaptation:
      'La source montre un modèle à appuis pour avant-bras ; les machines à poignées nécessitent leur propre réglage.',
  },
  'push-up': {
    scope: 'Pompe au sol.',
    setup: [
      'Place les mains environ à la largeur des épaules, tends les jambes et gaine le corps en ligne droite.',
    ],
    movement: [
      'Descends la poitrine vers le sol en un bloc ; repousse le sol pour remonter.',
    ],
    checks: [
      'Garde la tête alignée, les hanches à niveau et une trajectoire confortable des coudes. Respire normalement.',
    ],
    mistakes: [
      'Hanches qui s’affaissent : contracte les fessiers et l’abdomen.',
      'Menton en avant : déplace la poitrine en premier.',
      'Répétitions partielles incontrôlées : réduis la difficulté.',
    ],
  },
  'barbell-bent-over-row': {
    scope: 'Rowing à la barre à deux bras ; prise non précisée.',
    setup: [
      'Tiens la barre avec une prise sûre et confortable ; incline-toi depuis les hanches avec les genoux souples et le dos stable.',
    ],
    movement: [
      'Tire vers l’abdomen en guidant les coudes vers l’arrière ; descends jusqu’à tendre les bras.',
    ],
    checks: ['Garde l’angle du tronc stable et la barre près du corps.'],
    mistakes: [
      'Redressement à chaque répétition : réduis la charge.',
      'Dos arrondi : replace la charnière de hanche.',
      'Barre arrachée : tire régulièrement.',
    ],
    adaptation:
      'La source montre un exemple en pronation ; cet ID générique du catalogue ne prescrit pas une prise particulière.',
  },
  'seated-cable-row': {
    scope: 'Tirage horizontal assis à la poulie ; accessoire non précisé.',
    setup: [
      'Prends appui sur les pieds, fléchis légèrement les genoux et redresse-toi ; saisis la poignée choisie sans arrondir le dos.',
    ],
    movement: [
      'Tire vers le tronc en ramenant les coudes en arrière puis tends lentement les bras.',
    ],
    checks: [
      'Garde le tronc stable et les poignets alignés ; évite de trop te pencher.',
    ],
    mistakes: [
      'Bascule en arrière : reste stable.',
      'Dos arrondi au départ : redresse-toi.',
      'Plaques qui s’entrechoquent : contrôle le retour.',
    ],
    adaptation:
      'La source utilise une poignée étroite ; cet ID générique du catalogue ne prescrit pas une prise particulière.',
  },
  'one-arm-dumbbell-row': {
    scope: 'Rowing à un bras avec appui sur un banc.',
    setup: [
      'Pose une main et un genou sur un banc stable ; stabilise le dos et tiens l’haltère sous l’autre épaule.',
    ],
    movement: [
      'Dirige le coude vers la hanche ; descends l’haltère sans tourner le tronc.',
    ],
    checks: [
      'Garde la tête alignée et les appuis stables. Répète de l’autre côté.',
    ],
    mistakes: [
      'Rotation pour soulever : réduis la charge.',
      'Épaule haussée : guide le coude.',
      'Épaule qui s’effondre : maintiens le contrôle.',
    ],
  },
  'chest-supported-dumbbell-row': {
    scope: 'Rowing à deux bras sur banc incliné.',
    setup: [
      'Allonge-toi poitrine contre un banc incliné stable ; prends appui sur les pieds et laisse pendre les haltères.',
    ],
    movement: [
      'Tire les coudes vers l’arrière ; descends les charges en gardant la poitrine en appui.',
    ],
    checks: [
      'Utilise une trajectoire confortable des coudes et garde la tête alignée.',
    ],
    mistakes: [
      'Poitrine décollée : maintiens le contact.',
      'Épaules haussées : réduis la charge.',
      'À-coups : tire et reviens lentement.',
    ],
    adaptation:
      'Adaptation des conseils ACE pour le rowing incliné ; la trajectoire des coudes n’est pas limitée à son exemple de tirage haut.',
  },
  'lat-pulldown': {
    scope: 'Tirage vertical générique ; prise et accessoire non précisés.',
    setup: [
      'Règle l’appui des cuisses et des pieds ; utilise une prise sûre et confortable.',
    ],
    movement: [
      'Tire devant le corps ; reviens lentement en laissant les omoplates bouger naturellement.',
    ],
    checks: ['Garde le tronc stable et choisis une amplitude confortable.'],
    mistakes: [
      'Tirage derrière la nuque : reste devant.',
      'Balancement : réduis la charge.',
      'Contact forcé avec la poitrine : termine confortablement.',
    ],
  },
  'lat-pulldown-wide-pronated-bar': {
    scope: 'Barre large ; prise en pronation.',
    setup: [
      'Fixe les cuisses et les pieds ; saisis la barre en pronation, plus large que les épaules.',
    ],
    movement: [
      'Guide les coudes vers le bas à mesure que la barre approche du haut de la poitrine ; tends lentement les bras.',
    ],
    checks: [
      'Garde une légère inclinaison stable ; le contact avec la poitrine est facultatif.',
    ],
    mistakes: [
      'Prise trop large : choisis un écart confortable.',
      'Balancement du tronc : réduis la charge.',
      'Tirage derrière la nuque : reste devant.',
    ],
    adaptation:
      'Les repères pour barre large sont résumés en respectant la limite d’amplitude confortable approuvée par CRESUM.',
  },
  'lat-pulldown-close-neutral-v-handle': {
    scope: 'Prise neutre serrée ; poignée en V.',
    setup: [
      'Fixe l’appui des cuisses et les pieds ; saisis les deux côtés de la poignée en V, paumes face à face.',
    ],
    movement: ['Tire vers le haut de la poitrine puis reviens lentement.'],
    checks: [
      'Garde les poignets alignés et le tronc stable ; autorise le mouvement naturel des omoplates.',
    ],
    mistakes: [
      'Balancement : réduis la charge.',
      'Contact forcé avec la poitrine : termine confortablement.',
      'Coudes trop tirés en arrière : réduis l’amplitude.',
    ],
    adaptation:
      'Mécanique commune du tirage vertical adaptée à la variante CRESUM approuvée avec poignée en V.',
  },
  'lat-pulldown-reverse-grip': {
    scope: 'Prise en supination ; accessoire et largeur non précisés.',
    setup: [
      'Fixe les cuisses et les pieds ; choisis un écart confortable des mains, paumes vers le haut.',
    ],
    movement: [
      'Ramène les coudes vers le bas devant toi ; reviens avec contrôle.',
    ],
    checks: ['Garde les poignets confortables et le tronc stable.'],
    mistakes: [
      'Prise forcée : ajuste l’écartement.',
      'Balancement : réduis la charge.',
      'Tirage derrière la nuque : reste devant.',
    ],
    adaptation:
      'Variante de prise étayée par le résumé des auteurs chez ACSM ; exécution commune adaptée d’ACE, sans protocole validé séparément.',
  },
  'pull-up': {
    scope: 'Traction au poids du corps ; prise en pronation.',
    setup: [
      'Utilise une barre sûre et une prise fermée ; gaine le tronc en suspension contrôlée.',
    ],
    movement: [
      'Guide les coudes vers le bas pour soulever le corps ; redescends régulièrement au départ.',
    ],
    checks: [
      'Garde la tête alignée, évite les coups de jambes et utilise une amplitude confortable des épaules.',
    ],
    mistakes: [
      'Balancement : rétablis une suspension stable.',
      'Menton projeté : soulève le corps.',
      'Chute : contrôle la descente.',
    ],
  },
  'assisted-pull-up': {
    scope: 'Traction avec contrepoids ; l’appui de la machine varie.',
    setup: [
      'Choisis l’assistance et monte par les marches de l’appareil ; saisis les poignées et installe-toi sur l’appui.',
    ],
    movement: [
      'Tire vers le haut puis descends régulièrement. Replace l’appui au repos avant de descendre de l’appareil.',
    ],
    checks: [
      'Plus le contrepoids sélectionné est élevé, plus l’assistance est grande. Suis les indications de l’appareil.',
    ],
    mistakes: [
      'Saut depuis l’appui : utilise les marches.',
      'Balancement : ralentis.',
      'Assistance insuffisante : augmente l’aide.',
    ],
    adaptation:
      'L’exemple du fabricant utilise un coussin pour les genoux ; d’autres appuis nécessitent leurs propres instructions d’accès.',
  },
  'machine-high-row': {
    scope:
      'Tirage haut assis à la machine ; la trajectoire des poignées varie.',
    setup: [
      'Règle le siège et l’appui de poitrine pour atteindre confortablement les poignées ; soutiens les pieds et gaine le tronc.',
    ],
    movement: [
      'Tire les poignées vers le haut du tronc puis reviens avec contrôle.',
    ],
    checks: [
      'Garde la poitrine en appui et les poignets alignés ; suis la trajectoire de la machine.',
    ],
    mistakes: [
      'Décollage du coussin : réduis la charge.',
      'Poignées arrachées : ralentis.',
      'Trajet forcé des coudes : termine confortablement.',
    ],
    adaptation:
      'Le réglage du tirage haut horizontal d’ACE sert de base à cette entrée générique ; les machines à leviers inclinés diffèrent.',
  },
  'cable-straight-arm-pulldown': {
    scope: 'Tirage debout par extension des épaules.',
    setup: [
      'Règle une poulie haute et fixe l’accessoire ; tiens-toi droit, genoux souples et bras dirigés vers l’avant et le haut.',
    ],
    movement: [
      'Ramène les bras en arc vers les cuisses puis reviens sans modifier sensiblement la flexion des coudes.',
    ],
    checks: [
      'Garde les côtes au-dessus du bassin et le tronc stable ; bouge par les épaules.',
    ],
    mistakes: [
      'Flexion des coudes comme au pushdown : conserve la longueur des bras.',
      'Dos cambré : gaine-toi.',
      'Balancement : utilise une charge maîtrisable.',
    ],
    adaptation:
      'L’accessoire reste non précisé ; la source mentionne une barre et une corde.',
  },
  'barbell-deadlift': {
    scope: 'Soulevé de terre conventionnel à la barre.',
    setup: [
      'Place les pieds sous la barre, fléchis les hanches et les genoux pour la saisir ; gaine-toi en gardant le dos stable.',
    ],
    movement: [
      'Repousse le sol et redresse-toi avec la barre près du corps ; fléchis les hanches et les genoux pour revenir.',
    ],
    checks: [
      'Garde les bras longs ; termine debout sans te pencher en arrière.',
    ],
    mistakes: [
      'Arrachage depuis le sol : prends d’abord la tension.',
      'Barre qui s’éloigne : garde-la près de toi.',
      'Hyperextension : tiens-toi droit.',
    ],
    adaptation:
      'Une prise sûre en double pronation est une option de départ prudente ; la source montre aussi une prise mixte.',
  },
  'dumbbell-shoulder-press': {
    scope: 'Développé au-dessus de la tête avec haltères.',
    setup: [
      'Tiens-toi stable avec les genoux souples ou assieds-toi sur un banc avec dossier ; place les haltères près des épaules.',
    ],
    movement: [
      'Pousse au-dessus de la tête puis reviens régulièrement au départ.',
    ],
    checks: [
      'Garde le tronc gainé et les poignets alignés ; laisse les épaules bouger naturellement au-dessus de la tête.',
    ],
    mistakes: [
      'Cambrure lombaire : contrôle les côtes.',
      'Impulsion des jambes : utilise le développé strict prévu.',
      'Trajectoire inégale : réduis la charge.',
    ],
    adaptation:
      'L’exemple cité est debout ; la position assise avec appui est une adaptation de stabilité.',
  },
  'barbell-overhead-press': {
    scope: 'Développé militaire strict debout à la barre.',
    setup: [
      'Sors la barre des supports à hauteur des épaules avec une prise sûre, soutenue par les avant-bras ; gaine le tronc.',
    ],
    movement: [
      'Pousse au-dessus de la tête en gardant de l’espace devant le visage ; redescends soigneusement aux épaules.',
    ],
    checks: [
      'Garde les pieds et les côtes stables ; pas d’impulsion volontaire des jambes.',
    ],
    mistakes: [
      'Cambrure excessive : gaine-toi.',
      'Choc au menton : contrôle le passage de la barre.',
      'Rebond sur les épaules : marque une pause et replace-toi.',
    ],
  },
  'machine-shoulder-press': {
    scope: 'Développé épaules à la machine avec appui ; prise non précisée.',
    setup: [
      'Règle le siège pour placer les poignées environ à hauteur des épaules ; soutiens les pieds et le dos.',
    ],
    movement: [
      'Pousse vers le haut selon la trajectoire confortable de la machine puis descends régulièrement.',
    ],
    checks: ['Aligne les poignets et évite une cambrure lombaire excessive.'],
    mistakes: [
      'Mauvaise hauteur du siège : règle-la.',
      'Dos décollé du dossier : réduis la charge.',
      'Retour brutal : contrôle-le.',
    ],
    adaptation:
      'ACE présente des poignées rapprochées ; l’ID générique CRESUM n’impose pas cette prise.',
  },
  'dumbbell-lateral-raise': {
    scope: 'Élévation latérale avec haltères debout.',
    setup: [
      'Tiens-toi stable, haltères près des cuisses, coudes souples et poignets alignés.',
    ],
    movement: [
      'Élève les bras latéralement vers la hauteur des épaules puis redescends lentement.',
    ],
    checks: [
      'Garde le tronc stable ; ne force pas une position avec les pouces vers le bas.',
    ],
    mistakes: [
      'Balancement : réduis la charge.',
      'Épaules haussées : détends le cou.',
      'Hauteur excessive : reste dans une amplitude confortable.',
    ],
  },
  'cable-lateral-raise': {
    scope: 'Élévation latérale à un bras à la poulie.',
    setup: [
      'Place-toi de côté par rapport au câble et prends la poignée opposée ; adopte une position stable.',
    ],
    movement: [
      'Lève le bras latéralement vers la hauteur de l’épaule puis descends régulièrement ; change de côté.',
    ],
    checks: ['Garde le tronc stable et le coude légèrement fléchi.'],
    mistakes: [
      'Inclinaison pour soulever : réduis la charge.',
      'Épaule haussée : guide le bras.',
      'Croisement dangereux du câble : vérifie l’espace libre.',
    ],
    adaptation:
      'La source utilise une poulie à hauteur de taille ; une poulie plus basse nécessite un passage libre du câble et un réglage confortable.',
  },
  'reverse-pec-deck': {
    scope: 'Machine à écartés inversés avec appui de poitrine.',
    setup: [
      'Fais face au coussin, règle une hauteur confortable des poignées et garde la poitrine en appui.',
    ],
    movement: [
      'Écarte les bras selon la trajectoire de l’appareil ; reviens sans rebond.',
    ],
    checks: ['Garde les coudes souples et évite d’avancer la tête.'],
    mistakes: [
      'Poitrine décollée : reste en appui.',
      'Épaules haussées : réduis la charge.',
      'Tirage trop loin : termine confortablement.',
    ],
    adaptation:
      'Adaptation CRESUM à la machine de la mécanique des écartés inversés ACE ; les indications du modèle utilisé déterminent le réglage exact.',
  },
  'resistance-band-pull-apart': {
    scope: 'Écarté horizontal avec élastique debout.',
    setup: [
      'Tiens un élastique en bon état devant la poitrine, bras longs et légère tension initiale.',
    ],
    movement: ['Ouvre les bras sur les côtés puis reviens lentement.'],
    checks: ['Garde le menton neutre et le tronc stable.'],
    mistakes: [
      'À-coups sur l’élastique : ralentis.',
      'Épaules haussées : détends le cou.',
      'Dos cambré : gaine le tronc.',
    ],
    adaptation:
      'La source est un exemple d’exercice de physiothérapie, pas une prescription de rééducation individuelle.',
  },
  'dumbbell-biceps-curl': {
    scope: 'Flexion des coudes avec haltères.',
    setup: [
      'Tiens-toi stable ou assieds-toi avec appui ; tiens les haltères paumes vers l’avant et bras le long du corps.',
    ],
    movement: [
      'Fléchis les coudes pour soulever les charges puis descends lentement.',
    ],
    checks: ['Garde les poignets alignés et le tronc stable.'],
    mistakes: [
      'Balancement : réduis la charge.',
      'Coudes vers l’avant : maintiens-les fixes.',
      'Poignets cassés : aligne les avant-bras.',
    ],
    adaptation:
      'L’exemple assis d’ACE est adapté à la configuration debout ou assise non précisée du catalogue.',
  },
  'barbell-curl': {
    scope: 'Curl debout avec barre droite.',
    setup: [
      'Tiens-toi avec une prise sûre paumes vers le haut environ à la largeur des épaules ; gaine le tronc.',
    ],
    movement: [
      'Fléchis les bras pour rapprocher la barre des épaules puis descends lentement.',
    ],
    checks: ['Garde les coudes près du corps et les poignets confortables.'],
    mistakes: [
      'Inclinaison en arrière : réduis la charge.',
      'Coudes projetés en avant : garde-les fixes.',
      'Barre lâchée : contrôle la descente.',
    ],
  },
  'ez-bar-curl': {
    scope: 'Curl debout avec barre EZ coudée.',
    setup: [
      'Prends les sections inclinées avec une prise semi-supinée confortable ; tiens-toi avec les genoux souples.',
    ],
    movement: ['Fléchis par les coudes puis descends avec contrôle.'],
    checks: ['Garde les bras stables et les poignets alignés.'],
    mistakes: [
      'Balancement : réduis la charge.',
      'Angle de poignet forcé : choisis des sections confortables.',
      'Retour court et incontrôlé : ralentis.',
    ],
    adaptation:
      'Adaptation du curl à la barre à une barre EZ ; aucun écartement précis universel des mains n’est prescrit.',
  },
  'hammer-curl': {
    scope: 'Curl avec haltères en prise neutre.',
    setup: [
      'Tiens-toi stable, paumes vers l’intérieur et coudes près du tronc.',
    ],
    movement: [
      'Fléchis un bras ou les deux avec les haltères ; descends en conservant la prise neutre.',
    ],
    checks: ['Garde les poignets alignés et les épaules calmes.'],
    mistakes: [
      'Paumes tournées vers le haut : conserve la prise neutre.',
      'Balancement du tronc : réduis la charge.',
      'Épaules haussées : détends-les.',
    ],
  },
  'cable-biceps-curl': {
    scope: 'Curl debout à la poulie basse ; accessoire non précisé.',
    setup: [
      'Règle une poulie basse, fixe l’accessoire et adopte une position stable.',
    ],
    movement: [
      'Fléchis les bras avec les coudes près du tronc puis reviens lentement.',
    ],
    checks: [
      'Garde les poignets confortables et résiste au câble sans te pencher.',
    ],
    mistakes: [
      'Impulsion du bassin : réduis la charge.',
      'Coudes qui balancent : maintiens-les fixes.',
      'Plaques qui se heurtent : ralentis le retour.',
    ],
    adaptation:
      'Le curl avec élastique ACE est adapté à une poulie basse en conservant la mécanique de flexion des coudes.',
  },
  'cable-triceps-pushdown': {
    scope: 'Extension des coudes à la poulie haute ; accessoire non précisé.',
    setup: [
      'Tiens-toi droit près d’une poulie haute ; saisis l’accessoire et rapproche les coudes des côtes.',
    ],
    movement: [
      'Tends les coudes vers le bas ; reviens sans déplacer sensiblement les bras.',
    ],
    checks: ['Utilise une prise sûre, des genoux souples et un tronc stable.'],
    mistakes: [
      'Balancement des épaules : garde les bras fixes.',
      'Dos cambré : gaine-toi.',
      'Choc des plaques : reviens lentement.',
    ],
    adaptation:
      'La source montre une corde ; l’ID générique du catalogue n’impose pas cet accessoire.',
  },
  'overhead-cable-triceps-extension': {
    scope:
      'Extension des coudes au-dessus de la tête à la poulie ; réglage variable.',
    setup: [
      'Place-toi de façon stable dos à la poulie ; tiens l’accessoire au-dessus de la tête avec le câble dégagé de celle-ci.',
    ],
    movement: [
      'Fléchis confortablement les coudes puis tends-les sans mouvement excessif des bras.',
    ],
    checks: ['Contrôle les côtes et garde la tête à distance de l’accessoire.'],
    mistakes: [
      'Dos cambré : réduis la charge.',
      'Coudes brusquement écartés : garde un alignement confortable.',
      'Câble contre la tête : revois le réglage.',
    ],
    adaptation:
      'Mécanique de l’extension avec haltère au-dessus de la tête adaptée au câble ; la hauteur de poulie dépend de la station.',
  },
  'dumbbell-overhead-triceps-extension': {
    scope: 'Extension au-dessus de la tête avec un haltère à deux mains.',
    setup: [
      'Tiens-toi stable, gaine-toi et soutiens fermement un haltère avec les deux mains au-dessus de la tête.',
    ],
    movement: [
      'Fléchis les coudes pour descendre derrière la tête puis tends régulièrement.',
    ],
    checks: ['Garde les bras relativement fixes et dégagés de la tête.'],
    mistakes: [
      'Cambrure excessive : gaine-toi.',
      'Épaules déplacées pour soulever : réduis la charge.',
      'Choc avec la tête : réduis l’amplitude.',
    ],
  },
  'close-grip-bench-press': {
    scope: 'Développé couché à la barre avec prise à la largeur des épaules.',
    setup: [
      'Allonge-toi sur un banc avec les pieds au sol ; utilise une prise fermée environ à la largeur des épaules et des sécurités ou une assistance.',
    ],
    movement: [
      'Descends vers la poitrine avec les coudes près des côtes puis pousse vers le haut.',
    ],
    checks: [
      'Garde les poignets au-dessus des avant-bras et les hanches en appui.',
    ],
    mistakes: [
      'Mains trop serrées : choisis un écart confortable.',
      'Rebond : contrôle la barre.',
      'Hanches décollées : garde le contact.',
    ],
  },
  'assisted-dip-machine': {
    scope: 'Machine à dips avec contrepoids.',
    setup: [
      'Choisis l’assistance ; utilise les marches pour saisir les poignées et t’installer sur l’appui.',
    ],
    movement: [
      'Descends dans une amplitude confortable puis pousse jusqu’à avoir les coudes presque tendus. Remets l’appui au repos avant de descendre de l’appareil.',
    ],
    checks: [
      'Reste droit et contrôlé ; plus de contrepoids donne plus d’assistance.',
    ],
    mistakes: [
      'Profondeur excessive : réduis l’amplitude.',
      'Épaules haussées ou rebond : réduis la difficulté.',
      'Saut depuis le coussin : utilise les marches.',
    ],
    adaptation:
      'Exemple du fabricant à coussin pour les genoux ; les autres appuis nécessitent leurs propres indications.',
  },
  'barbell-back-squat': {
    scope: 'Squat à la barre ; position de barre individuellement confortable.',
    setup: [
      'Règle les supports et les sécurités ; pose la barre sur le haut du dos, pas sur la nuque. Sors la barre et adopte une position stable.',
    ],
    movement: [
      'Fléchis les hanches et les genoux à une profondeur contrôlée ; remonte en poussant par les pieds en appui.',
    ],
    checks: ['Garde les genoux dans la direction des pieds et le tronc gainé.'],
    mistakes: [
      'Talons décollés : ajuste la position ou la profondeur.',
      'Genoux qui rentrent : réduis la charge.',
      'Dos arrondi : limite la profondeur.',
    ],
    adaptation:
      'Une profondeur confortable et contrôlée remplace une exigence universelle de descendre sous la parallèle.',
  },
  'barbell-front-squat': {
    scope: 'Squat avant avec barre sur les épaules.',
    setup: [
      'Règle les sécurités et pose la barre sur l’avant des épaules, coudes relevés ; adopte une position stable.',
    ],
    movement: [
      'Fléchis les hanches et les genoux en gardant le tronc droit puis remonte régulièrement.',
    ],
    checks: [
      'Maintiens la position de la barre sur les épaules et les pieds en appui.',
    ],
    mistakes: [
      'Coudes qui baissent : replace la barre.',
      'Barre tenue seulement par les poignets : soutiens-la sur les épaules.',
      'Profondeur forcée : réduis l’amplitude.',
    ],
  },
  'leg-press': {
    scope:
      'Presse à cuisses ; la géométrie des machines assises ou inclinées diffère.',
    setup: [
      'Règle la machine avec le dos et le bassin en appui et les pieds sur la plateforme ; règle les butées de sécurité lorsqu’elles sont disponibles.',
    ],
    movement: [
      'Tends les jambes sans verrouillage brutal puis fléchis les hanches et les genoux pour revenir avec contrôle.',
    ],
    checks: [
      'Garde les talons et le bassin en appui ; évite de comprimer le tronc avec les cuisses.',
    ],
    mistakes: [
      'Bassin décollé : réduis la profondeur.',
      'Verrouillage des genoux : termine doucement.',
      'Rebond : contrôle le retour.',
    ],
    adaptation:
      'La source montre un modèle assis ; l’accès et les sécurités d’un chariot incliné suivent ses propres indications.',
  },
  'smith-machine-squat': {
    scope: 'Squat à barre guidée ; angle des rails et réglages variables.',
    setup: [
      'Règle les butées de sécurité ; pose la barre sur le haut du dos et trouve une position stable adaptée au trajet des rails.',
    ],
    movement: [
      'Déverrouille volontairement ; effectue le squat avec contrôle puis remonte et raccroche fermement.',
    ],
    checks: [
      'Garde les pieds en appui et le tronc gainé ; ne force pas une trajectoire fixe inconfortable.',
    ],
    mistakes: [
      'Sécurités absentes : règle-les.',
      'Position forcée : ajuste le réglage.',
      'Raccrochage incertain : vérifie les crochets.',
    ],
    adaptation:
      'Mécanique du squat libre adaptée à une barre guidée ; suis les instructions du fabricant concerné.',
  },
  'goblet-squat': {
    scope: 'Squat avec haltère tenu devant la poitrine.',
    setup: [
      'Tiens fermement un haltère contre la poitrine et adopte une position stable.',
    ],
    movement: [
      'Fléchis les hanches et les genoux puis remonte avec le tronc contrôlé.',
    ],
    checks: [
      'Garde les coudes proches, les pieds en appui et les genoux dans une direction confortable.',
    ],
    mistakes: [
      'Charge qui s’éloigne : garde-la près de toi.',
      'Talons décollés : ajuste la profondeur.',
      'Dos arrondi : réduis l’amplitude.',
    ],
    adaptation:
      'Une profondeur confortable et contrôlée prime sur l’exemple sous le niveau des genoux de la source.',
  },
  'dumbbell-reverse-lunge': {
    scope: 'Haltères le long du corps ; pas vers l’arrière.',
    setup: ['Tiens-toi stable avec les haltères près des cuisses.'],
    movement: [
      'Recule d’un pas, descends avec contrôle puis reviens ; répète des deux côtés.',
    ],
    checks: ['Garde les pieds espacés pour l’équilibre et le tronc stable.'],
    mistakes: [
      'Position trop étroite sur une ligne : élargis l’écartement.',
      'Chute vers le bas : contrôle le pas.',
      'Genou qui rentre : réduis l’amplitude.',
    ],
  },
  'bulgarian-split-squat': {
    scope: 'Split squat avec haltères et pied arrière surélevé.',
    setup: [
      'Choisis un banc ou une plateforme stable et une position en fente équilibrée ; tiens les haltères fermement.',
    ],
    movement: [
      'Descends les hanches en fléchissant les jambes puis remonte régulièrement. Répète des deux côtés.',
    ],
    checks: ['Garde le pied avant en appui et le tronc stable.'],
    mistakes: [
      'Banc trop haut : utilise un appui confortable.',
      'Rebond de la jambe arrière : ralentis.',
      'Genou qui rentre : ajuste la position ou la charge.',
    ],
    adaptation:
      'ACE montre un haltère tenu devant soi ; le catalogue permet les haltères le long du corps sans changer l’identité de l’exercice.',
  },
  'leg-extension': {
    scope: 'Machine d’extension des genoux assise.',
    setup: [
      'Aligne les genoux avec l’axe de l’appareil, soutiens le dos et place le coussin sur les tibias au-dessus des chevilles.',
    ],
    movement: [
      'Tends régulièrement les genoux vers la position droite puis descends avec contrôle.',
    ],
    checks: [
      'Reste en appui et utilise une amplitude confortable sans verrouillage brutal.',
    ],
    mistakes: [
      'Axe mal aligné : règle le siège.',
      'Coup dans le coussin : réduis la charge.',
      'Retour partiel et saccadé : bouge régulièrement.',
    ],
  },
  'lying-leg-curl': {
    scope: 'Machine de flexion des genoux allongé sur le ventre.',
    setup: [
      'Aligne les genoux avec l’axe ; place le coussin du bas des jambes à distance des talons et tiens les poignées d’appui.',
    ],
    movement: [
      'Fléchis les genoux pour soulever le coussin puis redescends lentement.',
    ],
    checks: ['Garde le bassin en appui et évite les mouvements lombaires.'],
    mistakes: [
      'Hanches décollées : réduis la charge.',
      'Dos cambré : gaine-toi.',
      'Coussin sur le talon : ajuste la position.',
    ],
  },
  'seated-leg-curl': {
    scope: 'Machine de flexion des genoux assise.',
    setup: [
      'Soutiens le dos, aligne les genoux avec l’axe et fixe l’appui des cuisses ; pose le bas des jambes sur le rouleau.',
    ],
    movement: [
      'Ramène les talons vers le bas et l’arrière puis tends lentement les genoux vers la position initiale.',
    ],
    checks: ['Garde le tronc et les cuisses en appui ; bouge régulièrement.'],
    mistakes: [
      'À-coups : réduis la charge.',
      'Décollage du siège : fixe l’appui.',
      'Extension brutale : termine doucement.',
    ],
  },
  'barbell-romanian-deadlift': {
    scope: 'Charnière de hanche à la barre depuis la position haute.',
    setup: [
      'Tiens-toi avec la barre près des cuisses, les genoux légèrement fléchis et le tronc gainé.',
    ],
    movement: [
      'Recule les hanches pendant que la barre descend près des jambes ; remonte par extension des hanches.',
    ],
    checks: [
      'Arrête-toi tant que la charnière reste contrôlée ; toucher le sol n’est pas nécessaire.',
    ],
    mistakes: [
      'Squat à la place : recule les hanches.',
      'Barre qui s’éloigne : garde-la près de toi.',
      'Dos arrondi pour gagner en profondeur : arrête plus tôt.',
    ],
  },
  'dumbbell-romanian-deadlift': {
    scope: 'Charnière de hanche avec haltères depuis la position haute.',
    setup: [
      'Tiens les haltères devant les cuisses ; assouplis les genoux et gaine-toi.',
    ],
    movement: [
      'Recule les hanches en gardant les charges proches puis redresse-toi régulièrement.',
    ],
    checks: [
      'Laisse la tolérance des ischio-jambiers limiter la profondeur ; garde la colonne stable.',
    ],
    mistakes: [
      'Chercher le sol : arrête à une profondeur contrôlée.',
      'Dos arrondi : replace la charnière.',
      'Charges qui s’éloignent : garde-les proches.',
    ],
  },
  'barbell-hip-thrust': {
    scope: 'Extension des hanches à la barre avec appui sur banc.',
    setup: [
      'Fixe le banc et soutiens le haut du dos ; stabilise une barre rembourrée sur les hanches et pose fermement les pieds.',
    ],
    movement: [
      'Descends les hanches puis tends-les sans projeter les côtes vers le haut.',
    ],
    checks: [
      'Garde les pieds stables et termine avec les hanches et le tronc alignés.',
    ],
    mistakes: [
      'Banc qui glisse : fixe-le.',
      'Hyperextension lombaire : arrête à l’alignement.',
      'Barre qui roule : stabilise-la.',
    ],
    adaptation:
      'Mécanique du pont avec haltère sur banc adaptée à une barre rembourrée.',
  },
  'cable-glute-kickback': {
    scope: 'Extension des hanches debout à la poulie.',
    setup: [
      'Fixe une sangle de cheville à une poulie basse ; tiens un appui stable et fléchis légèrement le genou d’appui.',
    ],
    movement: [
      'Déplace la jambe active vers l’arrière par la hanche puis reviens lentement. Répète des deux côtés.',
    ],
    checks: ['Garde le bassin de face et le tronc stable.'],
    mistakes: [
      'Dos cambré : réduis l’amplitude.',
      'Rotation vers l’extérieur : garde le bassin stable.',
      'À-coup sur la sangle : réduis la charge.',
    ],
    adaptation:
      'L’exemple ACE d’extension des hanches avec élastique est adapté à une poulie avec sangle de cheville.',
  },
  'standing-calf-raise': {
    scope: 'Élévation des mollets debout à la machine ; l’appui varie.',
    setup: [
      'Place confortablement l’appui de la machine ; pose fermement l’avant des pieds sur la plateforme et garde les jambes longues sans verrouillage forcé des genoux.',
    ],
    movement: [
      'Lève les talons, marque une courte pause puis descends avec contrôle.',
    ],
    checks: [
      'Utilise une amplitude confortable des chevilles et évite les rebonds.',
    ],
    mistakes: [
      'Pompage des genoux : garde la position des jambes.',
      'Rebond rapide : marque une pause.',
      'Chevilles qui roulent : garde les pieds stables.',
    ],
    adaptation:
      'Conseils généraux debout adaptés à un appui de machine ; chargement et accès suivent les indications de l’appareil.',
  },
  'seated-calf-raise': {
    scope: 'Élévation des mollets à la machine avec genoux fléchis.',
    setup: [
      'Règle les coussins des cuisses au-dessus des genoux, avant des pieds bien soutenu et talons libres.',
    ],
    movement: [
      'Lève les talons, marque une pause puis descends lentement dans une amplitude confortable.',
    ],
    checks: [
      'Garde les genoux fléchis et utilise les chevilles sans balancer le tronc.',
    ],
    mistakes: [
      'Rebond : marque une pause.',
      'Coussin sur la rotule : règle-le.',
      'Pieds qui glissent : repositionne-les.',
    ],
    adaptation:
      'Adaptation à la machine de la technique des mollets assis ; déverrouillage et sécurités suivent les indications de l’appareil.',
  },
  'machine-hip-adduction': {
    scope: 'Machine d’adduction des hanches assise.',
    setup: [
      'Soutiens les pieds et le dos ; règle une largeur initiale confortable avec l’intérieur des cuisses contre les coussins.',
    ],
    movement: ['Rapproche les jambes lentement puis reviens avec contrôle.'],
    checks: [
      'Tiens les poignées et utilise le mécanisme de déverrouillage avant de sortir.',
    ],
    mistakes: [
      'Largeur initiale excessive : réduis-la.',
      'Tronc qui balance : reste en appui.',
      'Plaques qui se heurtent : reviens lentement.',
    ],
    adaptation:
      'Exemple du fabricant ; les commandes exactes de réglage varient selon les machines.',
  },
  'kettlebell-swing': {
    scope:
      'Swing à deux mains par charnière de hanche, sans passage au-dessus de la tête.',
    setup: [
      'Apprends d’abord une charnière de hanche contrôlée ; saisis fermement une kettlebell maîtrisable avec les pieds stables.',
    ],
    movement: [
      'Envoie la kettlebell en arrière ; tends les hanches pour la laisser monter devant toi puis replie les hanches au retour.',
    ],
    checks: [
      'Garde la colonne stable ; produis l’impulsion par les hanches plutôt que de lever avec les bras.',
    ],
    mistakes: [
      'Squat : recule les hanches.',
      'Levée avec les bras : laisse les hanches donner l’impulsion.',
      'Inclinaison en arrière : termine droit.',
    ],
  },
  plank: {
    scope: 'Planche sur les avant-bras ; maintien chronométré.',
    setup: [
      'Place les coudes sous les épaules, prends appui sur les orteils et gaine le tronc.',
    ],
    movement: [
      'Forme une ligne droite avec le corps ; respire pendant le maintien puis descends doucement.',
    ],
    checks: [
      'Garde la tête alignée et les hanches à niveau ; termine lorsque l’alignement ne peut plus être maintenu.',
    ],
    mistakes: [
      'Dos qui s’affaisse : raccourcis le maintien.',
      'Hanches trop hautes : réaligne-toi.',
      'Apnée : respire régulièrement.',
    ],
  },
  'hanging-knee-raise': {
    scope: 'Montée des genoux fléchis en suspension.',
    setup: [
      'Saisis une barre sûre et établis une suspension stable avec les épaules soutenues.',
    ],
    movement: [
      'Monte les genoux en enroulant doucement le bassin ; descends sans balancement.',
    ],
    checks: [
      'Utilise une action contrôlée de l’abdomen et du bassin en gardant les épaules soutenues.',
    ],
    mistakes: [
      'Coups de jambes : rétablis la suspension.',
      'Jambes lâchées : descends lentement.',
      'Prise qui cède : arrête avant de perdre le contrôle.',
    ],
    adaptation:
      'Une installation prudente en suspension complète les conseils NASM de contrôle du bassin.',
  },
  'cable-crunch': {
    scope: 'Flexion du tronc à la poulie ; posture non précisée.',
    setup: [
      'Installe une poulie haute en sécurité et tiens l’accessoire près de la tête avec les hanches stables.',
    ],
    movement: [
      'Rapproche les côtes du bassin contre la résistance puis reviens lentement.',
    ],
    checks: [
      'Les mains servent surtout à soutenir l’accessoire, pas à tirer avec les bras.',
    ],
    mistakes: [
      'Charnière de hanche seule : déplace les côtes.',
      'Tirage avec les bras : garde les mains fixes.',
      'Choc des plaques : ralentis le retour.',
    ],
    adaptation:
      'La source montre un crunch debout ; les versions à genoux nécessitent leur propre position stable.',
  },
  'back-extension': {
    scope:
      'Extension des hanches ou du dos ; géométrie de machine non précisée.',
    setup: [
      'Sur un banc d’extension des hanches, soutiens le haut des cuisses avec le coussin sous les hanches et fixe les pieds.',
    ],
    movement: [
      'Incline-toi avec le tronc stable ; remonte jusqu’à aligner le corps, pas au-delà.',
    ],
    checks: [
      'Sur une machine lombaire assise, soutiens les pieds avec les genoux souples et les hanches contre le coussin lombaire ; règle l’amplitude initiale. Étends régulièrement le tronc vers l’appui puis reviens avec contrôle ; suis les indications propres à l’appareil.',
    ],
    mistakes: [
      'Hyperextension : arrête à l’alignement.',
      'Balancement : ralentis.',
      'Dos arrondi sous charge : réduis l’amplitude.',
    ],
    adaptation:
      'L’exemple du banc à charnière de hanche est explicite ; il ne redéfinit pas cet ID générique comme un seul type de machine.',
  },
  'dumbbell-shrug': {
    scope: 'Haussement des épaules avec haltères debout.',
    setup: [
      'Tiens-toi stable avec les haltères le long du corps et les bras longs.',
    ],
    movement: ['Monte les épaules vers les oreilles puis descends lentement.'],
    checks: ['Garde la tête alignée, les poignets droits et le tronc stable.'],
    mistakes: [
      'Cercles d’épaules : bouge verticalement.',
      'Flexion des coudes : garde les bras longs.',
      'Tête projetée : reste aligné.',
    ],
  },
  'farmers-carry': {
    scope: 'Marche avec deux haltères ; mesure par distance.',
    setup: [
      'Ramasse les charges avec contrôle et tiens-les fermement près des hanches ; dégage le trajet.',
    ],
    movement: [
      'Marche régulièrement avec de petits pas contrôlés ; tourne prudemment et repose les charges avec contrôle.',
    ],
    checks: ['Reste droit, respire et garde les épaules à niveau.'],
    mistakes: [
      'Virages précipités : ralentis.',
      'Inclinaison latérale : réduis la charge.',
      'Prise qui lâche : arrête en sécurité.',
    ],
    adaptation:
      'La prise neutre le long du corps précise le libellé ambigu des paumes dans la source ; une distance n’est pas une répétition.',
  },
  'standing-cable-anti-rotation-press': {
    scope: 'Développé antirotation debout à deux mains ; deux côtés.',
    setup: [
      'Place-toi de côté près d’un câble à hauteur de poitrine, pieds stables ; tiens la poignée près de la poitrine.',
    ],
    movement: [
      'Pousse les mains vers l’avant en résistant à la rotation puis reviens ; répète en faisant face à l’autre côté.',
    ],
    checks: ['Garde le bassin et les côtes dirigés vers l’avant.'],
    mistakes: [
      'Rotation du tronc : réduis la charge.',
      'Dos cambré : gaine-toi.',
      'Câble détendu : ajuste la distance.',
    ],
    adaptation:
      'Conseils ACE pour élastique et câble adaptés à la configuration à poulie du catalogue.',
  },
  'bodyweight-step-up': {
    scope: 'Montée sur marche sans charge ; chaque jambe directrice.',
    setup: [
      'Choisis une plateforme stable que tu peux maîtriser ; pose tout le pied de la jambe directrice dessus.',
    ],
    movement: [
      'Monte régulièrement puis redescends avec contrôle ; répète avec chaque jambe directrice.',
    ],
    checks: ['Garde le genou aligné avec le pied et évite de sauter.'],
    mistakes: [
      'Plateforme haute : réduis la hauteur.',
      'Genou qui rentre : contrôle l’alignement.',
      'Chute vers le bas : descends lentement.',
    ],
    adaptation:
      'Adaptation sans charge de la montée sur marche ACE avec haltères ; aucune charge externe pour cet ID.',
  },
  'dumbbell-floor-glute-bridge': {
    scope: 'Extension des hanches avec haltère et appui au sol.',
    setup: [
      'Allonge-toi au sol, genoux fléchis et pieds en appui ; stabilise un haltère en travers des hanches.',
    ],
    movement: [
      'Pousse les pieds vers le sol et soulève les hanches puis descends lentement.',
    ],
    checks: ['Garde le haut du dos au sol et les côtes contrôlées.'],
    mistakes: [
      'Dos cambré : arrête à l’alignement.',
      'Charge qui roule : fixe-la.',
      'Poussée avec le cou : détends la tête.',
    ],
  },
  'lying-barbell-triceps-extension': {
    scope: 'Extension des coudes à la barre allongé sur le dos.',
    setup: [
      'Allonge-toi sur un banc horizontal avec les pieds en appui ; utilise une prise fermée en pronation et tiens la barre au-dessus de la zone tête-poitrine.',
    ],
    movement: [
      'Fléchis les coudes pour descendre en gardant de l’espace près de la tête puis tends régulièrement.',
    ],
    checks: ['Garde les bras fixes et les poignets alignés.'],
    mistakes: [
      'Barre contre la tête : maintiens un espace.',
      'Coudes qui dérivent : réduis la charge.',
      'Poignets cassés : aligne les avant-bras.',
    ],
  },
});
