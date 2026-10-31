import { flattenTechniqueText } from '../../technique-text';
export default flattenTechniqueText({
  'kettlebell-goblet-squat': {
    scope: 'Eine Kettlebell mit beiden Händen auf Brusthöhe.',
    setup: [
      'Halte die Kettlebell an der Brust; stelle die Füße etwa schulterbreit mit leicht nach außen gerichteten Zehen auf.',
    ],
    movement: [
      'Beuge Hüfte und Knie und senke dich kontrolliert ab; drücke dich über die Füße in den Stand.',
    ],
    checks: [
      'Halte die Brust aufgerichtet, den Rücken kontrolliert und die Ellbogen nach vorn.',
    ],
    mistakes: [
      'Gewicht wandert nach vorn: halte es nah am Körper.',
      'Fersen heben ab: verringere die Tiefe.',
      'Oberkörper sackt zusammen: verwende weniger Gewicht.',
    ],
    adaptation:
      'Gekürzte ACE-Anleitung für Kettlebells; wähle eine angenehme kontrollierte Tiefe und belaste den ganzen Fuß.',
  },
  'seated-cable-row-close-neutral-v-handle': {
    scope: 'Sitzendes Rudern am tiefen Kabelzug; V-Griff; enger Neutralgriff.',
    setup: [
      'Sitze aufrecht mit fest abgestützten Füßen und leicht gebeugten Knien. Umfasse mit jeder Hand einen der parallelen Griffe, Handflächen zueinander; strecke die Arme, ohne den Rücken zu runden.',
    ],
    movement: [
      'Ziehe den Griff zum Bauch und führe die Ellenbogen nahe am Körper nach hinten; strecke die Arme langsam zur Rückkehr.',
    ],
    checks: [
      'Halte den Rumpf stabil und die Handgelenke in einer Linie mit den Unterarmen. Lass die Schulterblätter natürlich mitgehen, ohne die Schultern hochzuziehen.',
    ],
    mistakes: [
      'Zurückschwingen beim Ziehen: reduziere das Gewicht und halte den Rumpf stabil.',
      'Abgeknickte Handgelenke: richte den Neutralgriff neu aus.',
      'Aufschlagen des Gewichtsblocks: kontrolliere die Rückkehr.',
    ],
    adaptation:
      'Das Beispiel mit engem Griff wird für diese konkrete Konfiguration im Neutralgriff verwendet. Muskelrollen sind qualitativ und messen weder Aktivierung noch einen Vorteil gegenüber anderen Griffen.',
  },
  'lat-pulldown-close-neutral-ergonomic-handle': {
    scope:
      'Latzug im Sitzen vor dem Körper; kurzer ergonomischer Griff; enger Neutralgriff.',
    setup: [
      'Oberschenkel fixieren und Füße abstützen. Zur oberen Rolle sitzen; Handflächen an die Auflagen legen und die abgerundeten Kanten umgreifen, Handflächen zueinander.',
    ],
    movement: [
      'Ellenbogen seitlich nach unten führen und den Griff zur oberen Brust ziehen; kontrolliert bis zur angenehmen Armstreckung über dem Kopf zurückkehren.',
    ],
    checks: [
      'Handgelenke ausrichten, Becken stabil und eine leichte Rücklage konstant halten. Natürliche Schulterblattbewegung zulassen; Brustkontakt ist nicht nötig.',
    ],
    mistakes: [
      'Schwung aus dem Oberkörper: Gewicht reduzieren.',
      'Falscher Handkontakt oder abgeknickte Handgelenke: Griff korrigieren.',
      'Ellenbogen weit hinter dem Körper: Zug früher beenden.',
    ],
    adaptation:
      'Die allgemeine Latzugtechnik wurde an den ausgewählten kurzen ergonomischen Griff angepasst. Qualitative Muskelrollen belegen keinen Vorteil gegenüber anderen Griffbreiten.',
  },
  'barbell-bench-press': {
    scope: 'Flachbank; Langhantel.',
    setup: [
      'Stelle Ablage und Sicherheitsstreben ein; nutze bei anspruchsvollen Lasten einen Trainingspartner zur Sicherung. Lege dich mit gestützten Füßen und der Stange über den Augen hin.',
    ],
    movement: [
      'Greife geschlossen etwas breiter als schulterbreit. Senke kontrolliert zur Brustmitte ab und drücke nach oben.',
    ],
    checks: [
      'Halte die Handgelenke über den Unterarmen sowie Schultern und Hüfte auf der Bank. Atme beim Drücken aus.',
    ],
    mistakes: [
      'Abfedern der Stange: sanft absenken.',
      'Anheben der Hüfte: Bankkontakt halten.',
      'Abgeknickte Handgelenke: mit den Unterarmen ausrichten.',
    ],
  },
  'incline-dumbbell-press': {
    scope: 'Schrägbank; zwei Kurzhanteln.',
    setup: [
      'Stelle eine stabile Neigung ein und stütze beide Füße; bringe die Hanteln neben die obere Brust.',
    ],
    movement: [
      'Drücke beide Gewichte gleichzeitig nach oben und senke sie langsam bis zu einer angenehmen Tiefe.',
    ],
    checks: [
      'Halte Handgelenke über den Ellbogen sowie Kopf, Schultern und Hüfte auf der Bank.',
    ],
    mistakes: [
      'Übermäßiges Hohlkreuz: Rumpf anspannen.',
      'Ungleichmäßiges Absenken: gleichzeitig bewegen.',
      'Erzwungene Tiefe: Bewegungsumfang verkürzen.',
    ],
  },
  'dumbbell-bench-press': {
    scope: 'Flachbank; zwei Kurzhanteln.',
    setup: [
      'Lege dich mit gestützten Füßen hin; halte die Hanteln neben der Brust mit sicherem geschlossenem Griff.',
    ],
    movement: [
      'Drücke gleichzeitig nach oben; senke kontrolliert ab, wobei die Unterarme die Gewichte tragen.',
    ],
    checks: [
      'Halte Handgelenke gerade und Schultern gestützt. Atme beim Drücken aus.',
    ],
    mistakes: [
      'Zusammenstoß der Gewichte: Abstand lassen.',
      'Fallenlassen der Gewichte: Absenken kontrollieren.',
      'Anheben der Hüfte: Kontakt halten.',
    ],
  },
  'machine-chest-press': {
    scope: 'Brustpresse im Sitzen; Griffgeometrie variiert.',
    setup: [
      'Stelle den Sitz so ein, dass die Griffe etwa auf Brustmitte liegen. Halte den Rücken gestützt und die Füße stabil.',
    ],
    movement: [
      'Drücke gleichmäßig nach vorn; führe die Griffe kontrolliert zurück.',
    ],
    checks: [
      'Nutze einen geschlossenen Griff, gerade Handgelenke und einen angenehmen kontrollierten Bewegungsumfang.',
    ],
    mistakes: [
      'Sitz zu niedrig: Höhe neu einstellen.',
      'Schultern verlassen das Polster: Reichweite verringern.',
      'Heftiges Durchstrecken der Ellbogen: sanft abschließen.',
    ],
  },
  'cable-chest-fly': {
    scope: 'Kabel-Flys im Stehen; Zugwinkel abhängig von der Einstellung.',
    setup: [
      'Stehe stabil zwischen gleich eingestellten Rollen; halte beide Griffe mit leicht gebeugten Ellbogen.',
    ],
    movement: [
      'Führe die Arme bogenförmig nach vorn, bis sich die Hände annähern; kehre langsam zurück.',
    ],
    checks: [
      'Halte den Ellbogenwinkel und den Rumpf stabil; zwinge die Arme nicht hinter den Körper.',
    ],
    mistakes: [
      'Ausführung als Presse: Ellbogenwinkel halten.',
      'Schwingen: Last verringern.',
      'Übermäßiges Überkreuzen: ohne Handkollision abschließen.',
    ],
    adaptation:
      'Zusammenfassung der Kabel-Flys anhand des Crossovers der Quelle; ein Überkreuzen über die Mittellinie ist nicht erforderlich.',
  },
  'pec-deck-fly': {
    scope:
      'Butterfly im Sitzen; Griff- und Unterarmpolsterversionen unterscheiden sich.',
    setup: [
      'Stelle den Sitz für eine angenehme Ausrichtung der Gerätearme zu Brust und Schultern ein; stütze Rücken und Füße.',
    ],
    movement: [
      'Führe Polster oder Griffe gleichmäßig nach innen und kontrolliert zurück.',
    ],
    checks: [
      'Beachte das Geräteschild; vermeide eine erzwungene Schulterdehnung.',
    ],
    mistakes: [
      'Verlassen der Rückenlehne: Kontakt halten.',
      'Hochziehen der Schultern: Last verringern.',
      'Rucken am Gewichtsblock: Rückführung verlangsamen.',
    ],
    adaptation:
      'Die Quelle zeigt ein Modell mit Unterarmpolstern; Geräte mit Griffen benötigen eine eigene Einstellung.',
  },
  'push-up': {
    scope: 'Liegestütz am Boden.',
    setup: [
      'Platziere die Hände etwa schulterbreit, strecke die Beine und spanne den Körper in einer geraden Linie an.',
    ],
    movement: [
      'Senke die Brust als Einheit zum Boden; drücke den Boden weg, um dich anzuheben.',
    ],
    checks: [
      'Halte den Kopf ausgerichtet, die Hüfte auf einer Linie und die Ellbogenbahn angenehm. Atme normal.',
    ],
    mistakes: [
      'Absinkende Hüfte: Gesäß und Bauch anspannen.',
      'Vorschieben des Kinns: Brust zuerst bewegen.',
      'Unkontrollierte Teilwiederholungen: Schwierigkeit verringern.',
    ],
  },
  'barbell-bent-over-row': {
    scope: 'Beidarmiges Langhantelrudern; Griff nicht festgelegt.',
    setup: [
      'Greife die Stange sicher und bequem; beuge dich aus der Hüfte mit leicht gebeugten Knien und stabilem Rücken vor.',
    ],
    movement: [
      'Ziehe zum Bauch und führe die Ellbogen nach hinten; senke ab, bis die Arme gestreckt sind.',
    ],
    checks: ['Halte den Rumpfwinkel stabil und die Stange nah am Körper.'],
    mistakes: [
      'Aufrichten bei jeder Wiederholung: Last verringern.',
      'Runder Rücken: Hüftbeuge neu einstellen.',
      'Rucken an der Stange: gleichmäßig ziehen.',
    ],
    adaptation:
      'Die Quelle zeigt ein Beispiel im Obergriff; diese allgemeine Katalog-ID schreibt keinen bestimmten Griff vor.',
  },
  'seated-cable-row': {
    scope: 'Kabelrudern im Sitzen; Aufsatz nicht festgelegt.',
    setup: [
      'Stütze die Füße, beuge die Knie leicht und sitze aufrecht; greife den gewählten Griff ohne Rundrücken.',
    ],
    movement: [
      'Ziehe zum Rumpf, während die Ellbogen nach hinten gehen; strecke die Arme langsam wieder aus.',
    ],
    checks: [
      'Halte Rumpf und Handgelenke stabil; vermeide übermäßiges Zurücklehnen.',
    ],
    mistakes: [
      'Zurückschaukeln: stabil bleiben.',
      'Rundrücken am Start: aufrecht sitzen.',
      'Aufschlagender Gewichtsblock: Rückführung kontrollieren.',
    ],
    adaptation:
      'Die Quelle nutzt einen engen Griff; diese allgemeine Katalog-ID schreibt keinen bestimmten Griff vor.',
  },
  'one-arm-dumbbell-row': {
    scope: 'Einarmiges Rudern mit Bankstütze.',
    setup: [
      'Stütze eine Hand und ein Knie auf einer stabilen Bank; stabilisiere den Rücken und halte die Hantel unter der anderen Schulter.',
    ],
    movement: [
      'Ziehe den Ellbogen zur Hüfte; senke die Hantel ohne Rumpfdrehung ab.',
    ],
    checks: [
      'Halte den Kopf ausgerichtet und die Stützpunkte stabil. Wiederhole auf der anderen Seite.',
    ],
    mistakes: [
      'Hochdrehen zum Heben: Last verringern.',
      'Hochziehen der Schulter: Ellbogen führen.',
      'Absinken der Schulter: Kontrolle halten.',
    ],
  },
  'chest-supported-dumbbell-row': {
    scope: 'Beidarmiges Rudern auf der Schrägbank.',
    setup: [
      'Lege dich mit der Brust auf eine stabile Schrägbank; stütze die Füße und lasse die Hanteln hängen.',
    ],
    movement: [
      'Ziehe die Ellbogen nach hinten; senke die Gewichte mit weiter gestützter Brust.',
    ],
    checks: [
      'Nutze eine angenehme Ellbogenbahn und halte den Kopf ausgerichtet.',
    ],
    mistakes: [
      'Anheben der Brust: Polsterkontakt halten.',
      'Hochziehen der Schultern: Last verringern.',
      'Rucken: langsam ziehen und zurückführen.',
    ],
    adaptation:
      'Nach den ACE-Hinweisen zum Schrägbankrudern angepasst; die Ellbogenbahn ist nicht auf das hohe Ruderbeispiel festgelegt.',
  },
  'lat-pulldown': {
    scope: 'Allgemeiner Latzug; Griff und Aufsatz nicht festgelegt.',
    setup: [
      'Stelle Oberschenkelstütze und Füße ein; nutze einen angenehmen sicheren Griff.',
    ],
    movement: [
      'Ziehe vor dem Körper; kehre langsam mit natürlicher Schulterblattbewegung zurück.',
    ],
    checks: [
      'Halte den Rumpf stabil und wähle einen angenehmen Bewegungsumfang.',
    ],
    mistakes: [
      'Ziehen hinter den Nacken: vorn bleiben.',
      'Schwingen: Last verringern.',
      'Erzwungener Brustkontakt: angenehm abschließen.',
    ],
  },
  'lat-pulldown-wide-pronated-bar': {
    scope: 'Breite Stange; Obergriff.',
    setup: [
      'Fixiere Oberschenkel und Füße; greife die Stange im Obergriff breiter als schulterbreit.',
    ],
    movement: [
      'Führe die Ellbogen nach unten, während sich die Stange der oberen Brust nähert; strecke die Arme langsam aus.',
    ],
    checks: ['Halte eine geringe stabile Rücklage; Brustkontakt ist optional.'],
    mistakes: [
      'Übermäßige Griffbreite: angenehmen Griff wählen.',
      'Schwingender Rumpf: Last verringern.',
      'Zug hinter den Nacken: vorn bleiben.',
    ],
    adaptation:
      'Die Hinweise zur breiten Stange sind mit der von CRESUM freigegebenen Grenze eines angenehmen Bewegungsumfangs zusammengefasst.',
  },
  'lat-pulldown-close-neutral-v-handle': {
    scope: 'Enger Neutralgriff; V-Griff.',
    setup: [
      'Fixiere Oberschenkelpolster und Füße; greife beide Seiten des V-Griffs mit zueinander gerichteten Handflächen.',
    ],
    movement: ['Ziehe zur oberen Brust und kehre langsam zurück.'],
    checks: [
      'Halte Handgelenke gerade und Rumpf stabil; erlaube eine natürliche Schulterblattbewegung.',
    ],
    mistakes: [
      'Schwingen: Last verringern.',
      'Erzwungener Brustkontakt: angenehm abschließen.',
      'Zu weites Zurückziehen der Ellbogen: Bewegungsumfang verkürzen.',
    ],
    adaptation:
      'Gemeinsame Latzugmechanik, angepasst an die freigegebene CRESUM-Variante mit V-Griff.',
  },
  'lat-pulldown-reverse-grip': {
    scope: 'Untergriff; Aufsatz und Breite nicht festgelegt.',
    setup: [
      'Fixiere Oberschenkel und Füße; wähle einen angenehmen Handabstand mit nach oben gerichteten Handflächen.',
    ],
    movement: [
      'Ziehe die Ellbogen vorn nach unten; führe kontrolliert zurück.',
    ],
    checks: ['Halte Handgelenke angenehm und Rumpf stabil.'],
    mistakes: [
      'Erzwungener Griff: Abstand anpassen.',
      'Schwingen: Last verringern.',
      'Zug hinter den Nacken: vorn bleiben.',
    ],
    adaptation:
      'Die Griffvariante wird durch die Autoren-Zusammenfassung bei ACSM gestützt; die gemeinsame Ausführung ist von ACE angepasst und kein separat validiertes Protokoll.',
  },
  'pull-up': {
    scope: 'Klimmzug mit Körpergewicht; Obergriff.',
    setup: [
      'Nutze eine sichere Stange und einen geschlossenen Griff; spanne den Rumpf in einem kontrollierten Hang an.',
    ],
    movement: [
      'Führe die Ellbogen nach unten, um den Körper anzuheben; senke gleichmäßig zum Start.',
    ],
    checks: [
      'Halte den Kopf ausgerichtet und vermeide Beinschwung; nutze einen angenehmen Schulterbewegungsumfang.',
    ],
    mistakes: [
      'Schwingen: Hang neu stabilisieren.',
      'Kinn nach vorn strecken: Körper anheben.',
      'Fallenlassen: Absenken kontrollieren.',
    ],
  },
  'assisted-pull-up': {
    scope: 'Klimmzug mit Gegengewicht; Geräteunterstützung variiert.',
    setup: [
      'Wähle die Unterstützung und steige über die Gerätetritte auf; greife die Griffe und positioniere dich auf der Stütze.',
    ],
    movement: [
      'Ziehe dich hoch und senke gleichmäßig ab. Bringe die Stütze vor dem Absteigen in Ruheposition.',
    ],
    checks: [
      'Mehr gewähltes Gegengewicht bedeutet mehr Unterstützung. Beachte das Geräteschild.',
    ],
    mistakes: [
      'Abspringen von der Stütze: Tritte nutzen.',
      'Schwingen: Geschwindigkeit verringern.',
      'Zu wenig Unterstützung: Hilfe erhöhen.',
    ],
    adaptation:
      'Das Herstellerbeispiel nutzt ein Kniepolster; andere Stützformen benötigen eigene Aufstiegsanweisungen.',
  },
  'machine-high-row': {
    scope: 'Hohes Rudern im Sitzen am Gerät; Griffbahn variiert.',
    setup: [
      'Stelle Sitz und Brustpolster für angenehmes Erreichen ein; stütze die Füße und spanne den Rumpf an.',
    ],
    movement: [
      'Ziehe die Griffe zum oberen Rumpf und führe kontrolliert zurück.',
    ],
    checks: [
      'Halte die Brust gestützt und Handgelenke gerade; folge der Gerätebahn.',
    ],
    mistakes: [
      'Abheben vom Polster: Last verringern.',
      'Reißen an den Griffen: langsamer werden.',
      'Erzwungener Ellbogenweg: angenehm abschließen.',
    ],
    adaptation:
      'Die horizontale hohe Ruderposition von ACE dient als Grundlage dieser allgemeinen Angabe; Geräte mit schrägen Hebeln unterscheiden sich.',
  },
  'cable-straight-arm-pulldown': {
    scope: 'Zug durch Schulterstreckung im Stehen.',
    setup: [
      'Stelle eine hohe Rolle ein und sichere den Aufsatz; stehe aufrecht mit leicht gebeugten Knien und nach vorn/oben reichenden Armen.',
    ],
    movement: [
      'Führe die Arme bogenförmig zu den Oberschenkeln und zurück, ohne den Ellbogenwinkel wesentlich zu ändern.',
    ],
    checks: [
      'Halte Rippen über dem Becken und Rumpf stabil; bewege aus den Schultern.',
    ],
    mistakes: [
      'Ellbogenbeugung wie beim Trizepsdrücken: Armlänge halten.',
      'Hohlkreuz: Rumpf anspannen.',
      'Schwingen: gut kontrollierbare Last nutzen.',
    ],
    adaptation: 'Der Aufsatz bleibt offen; die Quelle nennt Stange und Seil.',
  },
  'barbell-deadlift': {
    scope: 'Konventionelles Langhantel-Kreuzheben.',
    setup: [
      'Stelle die Füße unter die Stange, beuge Hüfte und Knie zum Greifen; spanne dich mit stabilem Rücken an.',
    ],
    movement: [
      'Drücke den Boden weg und richte dich mit körpernaher Stange auf; beuge Hüfte und Knie zum Absetzen.',
    ],
    checks: ['Halte die Arme lang; ende aufrecht, ohne dich zurückzulehnen.'],
    mistakes: [
      'Ruck vom Boden: zunächst Spannung aufbauen.',
      'Stange entfernt sich: nah halten.',
      'Überstreckung: aufrecht stehen.',
    ],
    adaptation:
      'Ein sicherer beidseitiger Obergriff ist eine konservative Startoption; die Quelle zeigt auch einen Wechselgriff.',
  },
  'dumbbell-shoulder-press': {
    scope: 'Kurzhantel-Schulterdrücken.',
    setup: [
      'Stehe stabil mit leicht gebeugten Knien oder sitze auf einer Bank mit Rückenstütze; bringe die Hanteln neben die Schultern.',
    ],
    movement: ['Drücke über Kopf und senke gleichmäßig zum Start.'],
    checks: [
      'Halte Rumpf gespannt und Handgelenke gerade; lasse die Schultern natürlich über Kopf bewegen.',
    ],
    mistakes: [
      'Hohlkreuz: Rippen kontrollieren.',
      'Beinschub: den vorgesehenen strikten Druck ausführen.',
      'Ungleiche Bahn: Last verringern.',
    ],
    adaptation:
      'Das zitierte Beispiel ist im Stehen; gestütztes Sitzen ist eine Anpassung für Stabilität.',
  },
  'barbell-overhead-press': {
    scope: 'Striktes Langhantel-Schulterdrücken im Stehen.',
    setup: [
      'Hebe die Stange auf Schulterhöhe mit sicherem Griff aus der Ablage; die Unterarme tragen sie. Spanne den Rumpf an.',
    ],
    movement: [
      'Drücke über Kopf mit Abstand zum Gesicht; senke vorsichtig zu den Schultern.',
    ],
    checks: ['Halte Füße und Rippen stabil; kein bewusster Beinschub.'],
    mistakes: [
      'Übermäßige Rückbeuge: Rumpf anspannen.',
      'Kinn treffen: Abstand zur Stange kontrollieren.',
      'Abfedern von den Schultern: pausieren und neu ausrichten.',
    ],
  },
  'machine-shoulder-press': {
    scope: 'Gestütztes Schulterdrücken am Gerät; Griff nicht festgelegt.',
    setup: [
      'Stelle den Sitz so ein, dass die Griffe etwa auf Schulterhöhe liegen; stütze Füße und Rücken.',
    ],
    movement: [
      'Drücke entlang der angenehmen Gerätebahn nach oben und senke gleichmäßig.',
    ],
    checks: [
      'Halte Handgelenke gerade und vermeide ein übermäßiges Hohlkreuz.',
    ],
    mistakes: [
      'Falsche Sitzhöhe: einstellen.',
      'Verlassen der Lehne: Last verringern.',
      'Aufschlagen beim Zurückführen: kontrollieren.',
    ],
    adaptation:
      'ACE zeigt enge Griffe; die allgemeine CRESUM-ID verlangt diesen Griff nicht.',
  },
  'dumbbell-lateral-raise': {
    scope: 'Kurzhantel-Seitheben im Stehen.',
    setup: [
      'Stehe stabil mit Hanteln neben den Oberschenkeln, leicht gebeugten Ellbogen und geraden Handgelenken.',
    ],
    movement: [
      'Hebe die Oberarme seitlich etwa bis Schulterhöhe und senke langsam.',
    ],
    checks: [
      'Halte den Rumpf stabil; erzwinge keine Daumen-nach-unten-Position.',
    ],
    mistakes: [
      'Schwingen: Last verringern.',
      'Hochziehen der Schultern: Nacken entspannen.',
      'Zu große Höhe: im angenehmen Bereich stoppen.',
    ],
  },
  'cable-lateral-raise': {
    scope: 'Einarmiges Seitheben am Kabel.',
    setup: [
      'Stehe seitlich zum Kabel und greife den gegenüberliegenden Griff; nutze einen stabilen Stand.',
    ],
    movement: [
      'Hebe den Arm seitlich etwa bis Schulterhöhe und senke gleichmäßig; wechsle die Seite.',
    ],
    checks: ['Halte den Rumpf stabil und den Ellbogen leicht gebeugt.'],
    mistakes: [
      'Neigen zum Anheben: Last verringern.',
      'Hochziehen der Schulter: Oberarm führen.',
      'Unsicherer Kabelverlauf: Freiraum prüfen.',
    ],
    adaptation:
      'Die Quelle nutzt eine Rolle auf Taillenhöhe; tiefere Rollen benötigen freien Kabelverlauf und eine angenehme Einstellung.',
  },
  'reverse-pec-deck': {
    scope: 'Reverse-Fly-Gerät mit Bruststütze.',
    setup: [
      'Sitze zum Polster gewandt, stelle eine angenehme Griffhöhe ein und stütze die Brust.',
    ],
    movement: [
      'Öffne die Arme entlang der Gerätebahn; kehre ohne Abfedern zurück.',
    ],
    checks: [
      'Halte die Ellbogen leicht gebeugt und schiebe den Kopf nicht vor.',
    ],
    mistakes: [
      'Anheben der Brust: Kontakt halten.',
      'Hochziehen der Schultern: Last verringern.',
      'Zu weites Zurückziehen: angenehm abschließen.',
    ],
    adaptation:
      'CRESUM-Geräteanpassung der Reverse-Fly-Mechanik von ACE; die genaue Geräteeinstellung richtet sich nach dessen Schild.',
  },
  'resistance-band-pull-apart': {
    scope: 'Horizontales Auseinanderziehen eines Bands im Stehen.',
    setup: [
      'Halte ein unbeschädigtes Band mit langen Armen und leichter Anfangsspannung vor der Brust.',
    ],
    movement: ['Öffne die Arme seitlich und führe langsam zurück.'],
    checks: ['Halte Kinn neutral und Rumpf stabil.'],
    mistakes: [
      'Rucken am Band: verlangsamen.',
      'Hochziehen der Schultern: Nacken entspannen.',
      'Hohlkreuz: Rumpf anspannen.',
    ],
    adaptation:
      'Die Quelle ist ein physiotherapeutisches Übungsbeispiel, keine individuelle Rehabilitationsverordnung.',
  },
  'dumbbell-biceps-curl': {
    scope: 'Ellbogenbeugung mit Kurzhanteln.',
    setup: [
      'Stehe stabil oder sitze gestützt; halte die Hanteln mit nach vorn gerichteten Handflächen und Armen neben dem Körper.',
    ],
    movement: ['Beuge die Ellbogen, um die Gewichte zu heben; senke langsam.'],
    checks: ['Halte Handgelenke gerade und Rumpf stabil.'],
    mistakes: [
      'Schwingen: Last verringern.',
      'Ellbogen wandern nach vorn: stabil halten.',
      'Abgeknickte Handgelenke: mit den Unterarmen ausrichten.',
    ],
    adaptation:
      'Das sitzende ACE-Beispiel ist an die im Katalog offene stehende oder sitzende Ausführung angepasst.',
  },
  'barbell-curl': {
    scope: 'Stehender Curl mit gerader Stange.',
    setup: [
      'Stehe mit sicherem Untergriff etwa schulterbreit; spanne den Rumpf an.',
    ],
    movement: [
      'Beuge die Arme, um die Stange zu den Schultern zu heben; senke langsam.',
    ],
    checks: ['Halte Ellbogen am Körper und Handgelenke angenehm.'],
    mistakes: [
      'Zurücklehnen: Last verringern.',
      'Ellbogen nach vorn werfen: stabil halten.',
      'Stange fallenlassen: Absenken kontrollieren.',
    ],
  },
  'ez-bar-curl': {
    scope: 'Stehender Curl mit gewinkelter SZ-Stange.',
    setup: [
      'Nutze die schrägen Abschnitte für einen angenehmen halb supinierten Griff; stehe mit leicht gebeugten Knien.',
    ],
    movement: ['Beuge aus den Ellbogen und senke kontrolliert.'],
    checks: ['Halte Oberarme stabil und Handgelenke gerade.'],
    mistakes: [
      'Schwingen: Last verringern.',
      'Erzwungener Handgelenkwinkel: angenehme Griffabschnitte wählen.',
      'Kurze unkontrollierte Rückführung: verlangsamen.',
    ],
    adaptation:
      'Anpassung der Langhantel-Curl-Mechanik an eine SZ-Stange; kein universeller exakter Handabstand wird vorgeschrieben.',
  },
  'hammer-curl': {
    scope: 'Kurzhantel-Curl im Neutralgriff.',
    setup: [
      'Stehe stabil mit nach innen gerichteten Handflächen und Ellbogen neben dem Rumpf.',
    ],
    movement: [
      'Beuge einen oder beide Arme mit den Hanteln; senke bei gleichbleibendem Neutralgriff.',
    ],
    checks: ['Halte Handgelenke gerade und Schultern ruhig.'],
    mistakes: [
      'Handflächen nach oben drehen: Neutralgriff halten.',
      'Rumpfschwung: Last verringern.',
      'Hochziehen der Schultern: Schultern entspannen.',
    ],
  },
  'cable-biceps-curl': {
    scope: 'Stehender Curl am tiefen Kabel; Aufsatz nicht festgelegt.',
    setup: [
      'Stelle eine tiefe Rolle ein, sichere den Aufsatz und stehe stabil.',
    ],
    movement: ['Beuge die Ellbogen neben dem Rumpf und führe langsam zurück.'],
    checks: [
      'Halte Handgelenke angenehm und widerstehe dem Kabelzug ohne Zurücklehnen.',
    ],
    mistakes: [
      'Hüftstoß: Last verringern.',
      'Schwingende Ellbogen: stabil halten.',
      'Kollision des Gewichtsblocks: Rückführung verlangsamen.',
    ],
    adaptation:
      'Der ACE-Bandcurl ist mit gleicher Ellbogenbeugungsmechanik an ein tiefes Kabel angepasst.',
  },
  'cable-triceps-pushdown': {
    scope: 'Ellbogenstreckung am hohen Kabel; Aufsatz nicht festgelegt.',
    setup: [
      'Stehe aufrecht an einer hohen Rolle; halte den Aufsatz und bringe die Ellbogen neben die Rippen.',
    ],
    movement: [
      'Strecke die Ellbogen nach unten; führe ohne wesentliche Oberarmbewegung zurück.',
    ],
    checks: ['Nutze sicheren Griff, leicht gebeugte Knie und stabilen Rumpf.'],
    mistakes: [
      'Schulterschwung: Oberarme ruhig halten.',
      'Hohlkreuz: Rumpf anspannen.',
      'Aufschlagender Gewichtsblock: langsam zurückführen.',
    ],
    adaptation:
      'Die Quelle zeigt ein Seil; die allgemeine Katalog-ID schreibt diesen Aufsatz nicht vor.',
  },
  'overhead-cable-triceps-extension': {
    scope: 'Überkopf-Ellbogenstreckung am Kabel; Rolleneinstellung variiert.',
    setup: [
      'Stehe stabil mit dem Rücken zur Rolle; halte den Aufsatz über Kopf, ohne dass das Kabel den Kopf berührt.',
    ],
    movement: [
      'Beuge die Ellbogen angenehm und strecke sie ohne übermäßige Oberarmbewegung.',
    ],
    checks: ['Kontrolliere die Rippen und halte den Kopf vom Aufsatz frei.'],
    mistakes: [
      'Hohlkreuz: Last verringern.',
      'Abruptes Ausstellen der Ellbogen: angenehme Ausrichtung halten.',
      'Kabel trifft den Kopf: Einstellung ändern.',
    ],
    adaptation:
      'Überkopf-Kurzhantelmechanik ist an Kabelwiderstand angepasst; die Rollenhöhe richtet sich nach der Station.',
  },
  'dumbbell-overhead-triceps-extension': {
    scope: 'Beidhändige Kurzhantelstreckung über Kopf.',
    setup: [
      'Stehe stabil, spanne den Rumpf an und halte eine Hantel sicher mit beiden Händen über Kopf.',
    ],
    movement: [
      'Beuge die Ellbogen, um hinter den Kopf abzusenken; strecke gleichmäßig.',
    ],
    checks: ['Halte Oberarme relativ stabil und vom Kopf frei.'],
    mistakes: [
      'Übermäßige Rückbeuge: Rumpf anspannen.',
      'Heben durch Schulterbewegung: Last verringern.',
      'Kopf treffen: Bewegungsumfang verkürzen.',
    ],
  },
  'close-grip-bench-press': {
    scope: 'Langhantel-Bankdrücken mit schulterbreitem Griff.',
    setup: [
      'Lege dich mit aufgestellten Füßen auf eine Bank; nutze einen geschlossenen etwa schulterbreiten Griff und Sicherheitsstreben oder einen Sicherungspartner.',
    ],
    movement: [
      'Senke zur Brust mit Ellbogen nah an den Rippen und drücke nach oben.',
    ],
    checks: ['Halte Handgelenke über den Unterarmen und Hüfte gestützt.'],
    mistakes: [
      'Hände zu eng: angenehmen Abstand nutzen.',
      'Abfedern: Stange kontrollieren.',
      'Hüfte anheben: Kontakt halten.',
    ],
  },
  'assisted-dip-machine': {
    scope: 'Dip-Gerät mit Gegengewicht.',
    setup: [
      'Wähle die Unterstützung; nutze Tritte zum Greifen der Griffe und positioniere dich auf der Stütze.',
    ],
    movement: [
      'Senke in einem angenehmen Bereich ab und drücke bis fast gestreckte Ellbogen. Bringe die Stütze vor dem Absteigen in Ruheposition.',
    ],
    checks: [
      'Bleibe aufrecht und kontrolliert; mehr Gegengewicht gibt mehr Unterstützung.',
    ],
    mistakes: [
      'Übermäßige Tiefe: Umfang verkürzen.',
      'Schultern hochziehen oder abfedern: Schwierigkeit verringern.',
      'Abspringen vom Polster: Tritte nutzen.',
    ],
    adaptation:
      'Herstellerbeispiel mit Kniepolster; andere Stützformen benötigen ihr eigenes Geräteschild.',
  },
  'barbell-back-squat': {
    scope: 'Langhantel-Kniebeuge; Stangenposition individuell angenehm.',
    setup: [
      'Stelle Ablage und Sicherheitsstreben ein; lege die Stange auf die obere Rückenauflage, nicht auf den Nacken. Hebe aus und stehe stabil.',
    ],
    movement: [
      'Beuge Hüfte und Knie bis zu kontrollierter Tiefe; richte dich durch Druck über die gestützten Füße auf.',
    ],
    checks: ['Führe Knie in Richtung der Füße und spanne den Rumpf an.'],
    mistakes: [
      'Anheben der Fersen: Stand oder Tiefe ändern.',
      'Einknickende Knie: Last verringern.',
      'Rundrücken: Tiefe begrenzen.',
    ],
    adaptation:
      'Angenehme kontrollierte Tiefe ersetzt eine universelle Forderung nach einer Kniebeuge unterhalb der Parallele.',
  },
  'barbell-front-squat': {
    scope: 'Frontkniebeuge mit Langhantel.',
    setup: [
      'Stelle Sicherheitsstreben ein und lege die Stange mit angehobenen Ellbogen auf die vorderen Schultern; stehe stabil.',
    ],
    movement: [
      'Beuge Hüfte und Knie bei aufrechtem Rumpf und richte dich gleichmäßig auf.',
    ],
    checks: ['Halte die Frontablage und die Füße gestützt.'],
    mistakes: [
      'Absinkende Ellbogen: Ablage neu einrichten.',
      'Stange nur auf den Handgelenken: auf den Schultern tragen.',
      'Erzwungene Tiefe: Umfang verkürzen.',
    ],
  },
  'leg-press': {
    scope: 'Beinpresse; sitzende und geneigte Geräte unterscheiden sich.',
    setup: [
      'Stelle das Gerät mit gestütztem Rücken und Becken sowie festen Füßen auf der Platte ein; nutze vorhandene Sicherheitsstopps.',
    ],
    movement: [
      'Strecke die Beine ohne heftiges Durchdrücken und beuge Hüfte und Knie kontrolliert zurück.',
    ],
    checks: [
      'Halte Fersen und Becken gestützt; vermeide das Zusammendrücken des Rumpfes durch die Oberschenkel.',
    ],
    mistakes: [
      'Anheben des Beckens: Tiefe verkürzen.',
      'Durchdrücken der Knie: weich abschließen.',
      'Abfedern: Rückführung kontrollieren.',
    ],
    adaptation:
      'Die Quelle zeigt ein Sitzmodell; Einstieg und Sicherungen eines geneigten Schlittens richten sich nach dessen Schild.',
  },
  'smith-machine-squat': {
    scope:
      'Kniebeuge an geführter Stange; Schienenwinkel und Einstellung variieren.',
    setup: [
      'Stelle Sicherheitsstopps ein; lege die Stange auf den oberen Rücken und finde einen stabilen Stand passend zur Schienenbahn.',
    ],
    movement: [
      'Entriegle bewusst; beuge kontrolliert, richte dich auf und verriegle sicher.',
    ],
    checks: [
      'Halte Füße gestützt und Rumpf gespannt; erzwinge keine unangenehme feste Bahn.',
    ],
    mistakes: [
      'Fehlende Sicherungen: einstellen.',
      'Erzwungener Stand: Einstellung ändern.',
      'Unsichere Ablage: Haken prüfen.',
    ],
    adaptation:
      'Mechanik der freien Kniebeuge ist an eine geführte Stange angepasst; beachte die Anweisungen des jeweiligen Herstellers.',
  },
  'goblet-squat': {
    scope: 'Kniebeuge mit vor der Brust gehaltener Kurzhantel.',
    setup: [
      'Halte eine Hantel sicher vor der Brust und wähle einen stabilen Stand.',
    ],
    movement: [
      'Beuge Hüfte und Knie und richte dich mit kontrolliertem Rumpf auf.',
    ],
    checks: [
      'Halte Ellbogen nah, Füße gestützt und Knie angenehm ausgerichtet.',
    ],
    mistakes: [
      'Gewicht entfernt sich: nah halten.',
      'Anheben der Fersen: Tiefe ändern.',
      'Rundrücken: Umfang verringern.',
    ],
    adaptation:
      'Kontrollierte angenehme Tiefe hat Vorrang vor dem Beispiel unterhalb der Kniehöhe aus der Quelle.',
  },
  'dumbbell-reverse-lunge': {
    scope: 'Kurzhanteln seitlich; Schritt nach hinten.',
    setup: ['Stehe stabil mit Hanteln neben den Oberschenkeln.'],
    movement: [
      'Mache einen Schritt zurück, senke kontrolliert ab und kehre zurück; wiederhole beidseitig.',
    ],
    checks: [
      'Halte die Füße für das Gleichgewicht seitlich auseinander und den Rumpf stabil.',
    ],
    mistakes: [
      'Zu enger Seiltänzerstand: Abstand verbreitern.',
      'Fallenlassen nach unten: Schritt kontrollieren.',
      'Einknickendes Knie: Umfang verringern.',
    ],
  },
  'bulgarian-split-squat': {
    scope: 'Kurzhantel-Split-Squat mit erhöhtem hinterem Fuß.',
    setup: [
      'Wähle eine stabile Bank oder Plattform und einen ausgeglichenen Ausfallschrittstand; halte die Hanteln sicher.',
    ],
    movement: [
      'Senke die Hüfte durch Beugen der Beine und steige gleichmäßig auf. Wiederhole auf beiden Seiten.',
    ],
    checks: ['Halte vorderen Fuß gestützt und Rumpf stabil.'],
    mistakes: [
      'Bank zu hoch: angenehme Stütze wählen.',
      'Abfedern mit dem hinteren Bein: verlangsamen.',
      'Einknickendes Knie: Stand oder Last anpassen.',
    ],
    adaptation:
      'ACE zeigt eine vor der Brust gehaltene Hantel; der Katalog erlaubt seitlich gehaltene Hanteln bei gleicher Übungsidentität.',
  },
  'leg-extension': {
    scope: 'Beinstrecker im Sitzen.',
    setup: [
      'Richte die Knie an der Geräteachse aus, stütze den Rücken und platziere das Schienbeinpolster über den Knöcheln.',
    ],
    movement: [
      'Strecke die Knie gleichmäßig in Richtung gerade und senke kontrolliert ab.',
    ],
    checks: [
      'Bleibe gestützt und nutze einen angenehmen Umfang ohne heftiges Durchdrücken.',
    ],
    mistakes: [
      'Achsen passen nicht: Sitz neu einstellen.',
      'Treten gegen das Polster: Last verringern.',
      'Ruckartige kurze Rückführung: gleichmäßig bewegen.',
    ],
  },
  'lying-leg-curl': {
    scope: 'Beinbeuger in Bauchlage.',
    setup: [
      'Richte Knie und Geräteachse aus; stelle das Unterschenkelpolster mit Abstand zu den Fersen ein und halte die Stützgriffe.',
    ],
    movement: ['Beuge die Knie zum Heben des Polsters und senke langsam.'],
    checks: [
      'Halte das Becken gestützt und vermeide Bewegung der Lendenwirbelsäule.',
    ],
    mistakes: [
      'Anheben der Hüfte: Last verringern.',
      'Hohlkreuz: Rumpf anspannen.',
      'Polster auf der Ferse: Position ändern.',
    ],
  },
  'seated-leg-curl': {
    scope: 'Beinbeuger im Sitzen.',
    setup: [
      'Stütze den Rücken, richte Knie und Geräteachse aus und sichere die Oberschenkelstütze; lege die Unterschenkel auf die Rolle.',
    ],
    movement: [
      'Ziehe die Fersen nach unten/hinten und strecke die Knie langsam zum Start zurück.',
    ],
    checks: ['Halte Rumpf und Oberschenkel gestützt; bewege gleichmäßig.'],
    mistakes: [
      'Rucken: Last verringern.',
      'Aus dem Sitz anheben: Stütze sichern.',
      'Heftiges Strecken: sanft abschließen.',
    ],
  },
  'barbell-romanian-deadlift': {
    scope: 'Langhantel-Hüftbeuge von oben nach unten.',
    setup: [
      'Stehe mit der Stange nahe den Oberschenkeln, leicht gebeugten Knien und gespanntem Rumpf.',
    ],
    movement: [
      'Schiebe die Hüfte zurück, während die Stange nah an den Beinen sinkt; richte dich durch Hüftstreckung auf.',
    ],
    checks: [
      'Stoppe dort, wo die Hüftbeuge kontrolliert bleibt; Bodenkontakt ist nicht nötig.',
    ],
    mistakes: [
      'Stattdessen Kniebeuge: Hüfte zurückschieben.',
      'Stange entfernt sich: nah halten.',
      'Rundrücken für mehr Tiefe: früher stoppen.',
    ],
  },
  'dumbbell-romanian-deadlift': {
    scope: 'Kurzhantel-Hüftbeuge von oben nach unten.',
    setup: [
      'Stehe mit Hanteln vor den Oberschenkeln; beuge die Knie leicht und spanne den Rumpf an.',
    ],
    movement: [
      'Schiebe die Hüfte zurück und halte die Gewichte nah; richte dich gleichmäßig auf.',
    ],
    checks: [
      'Die Verträglichkeit in den hinteren Oberschenkeln begrenzt die Tiefe; halte die Wirbelsäule stabil.',
    ],
    mistakes: [
      'Boden erreichen wollen: bei kontrollierter Tiefe stoppen.',
      'Rundrücken: Hüftbeuge neu ausrichten.',
      'Gewichte entfernen sich: nah halten.',
    ],
  },
  'barbell-hip-thrust': {
    scope: 'Hüftstreckung mit Langhantel und Bankstütze.',
    setup: [
      'Sichere die Bank und stütze den oberen Rücken; stabilisiere eine gepolsterte Stange über der Hüfte und stelle die Füße fest auf.',
    ],
    movement: [
      'Senke die Hüfte und strecke sie, ohne die Rippen hochzuwerfen.',
    ],
    checks: ['Halte Füße stabil und ende mit ausgerichteter Hüfte und Rumpf.'],
    mistakes: [
      'Rutschende Bank: sichern.',
      'Überstreckung im unteren Rücken: bei geradem Körper stoppen.',
      'Rollende Stange: stabilisieren.',
    ],
    adaptation:
      'Mechanik einer bankgestützten Kurzhantelbrücke ist an eine gepolsterte Langhantel angepasst.',
  },
  'cable-glute-kickback': {
    scope: 'Stehende Hüftstreckung am Kabel.',
    setup: [
      'Befestige eine Knöchelmanschette an einer tiefen Rolle; halte eine stabile Stütze und beuge das Standknie leicht.',
    ],
    movement: [
      'Führe das Arbeitsbein aus der Hüfte nach hinten und langsam zurück. Wiederhole beidseitig.',
    ],
    checks: ['Halte Becken gerade und Rumpf stabil.'],
    mistakes: [
      'Hohlkreuz: Umfang verkürzen.',
      'Ausdrehen: Becken stabil halten.',
      'Rucken an der Manschette: Last verringern.',
    ],
    adaptation:
      'Das ACE-Bandbeispiel zur Hüftstreckung ist an ein Kabel mit Knöchelmanschette angepasst.',
  },
  'standing-calf-raise': {
    scope: 'Wadenheben im Stehen am Gerät; Stütze variiert.',
    setup: [
      'Positioniere die Gerätestütze angenehm; stelle die Vorfüße sicher auf die Plattform und halte die Knie lang, ohne erzwungenes Durchdrücken.',
    ],
    movement: ['Hebe die Fersen, pausiere kurz und senke kontrolliert.'],
    checks: ['Nutze einen angenehmen Sprunggelenkumfang ohne Federn.'],
    mistakes: [
      'Pumpen mit den Knien: Beinposition halten.',
      'Schnelles Federn: pausieren.',
      'Wegknickende Sprunggelenke: Füße stabil halten.',
    ],
    adaptation:
      'Allgemeine Hinweise zum stehenden Wadenheben sind an eine Gerätestütze angepasst; Laden und Aufsteigen richten sich nach dem Geräteschild.',
  },
  'seated-calf-raise': {
    scope: 'Wadenheben am Gerät mit gebeugten Knien.',
    setup: [
      'Stelle die Oberschenkelpolster oberhalb der Knie ein; stütze die Vorfüße sicher und lasse die Fersen frei.',
    ],
    movement: [
      'Hebe die Fersen, pausiere und senke langsam im angenehmen Bereich.',
    ],
    checks: [
      'Halte Knie gebeugt und bewege die Sprunggelenke, statt den Rumpf zu schaukeln.',
    ],
    mistakes: [
      'Federn: pausieren.',
      'Polster auf der Kniescheibe: neu einstellen.',
      'Rutschende Füße: neu positionieren.',
    ],
    adaptation:
      'Geräteanpassung der sitzenden Wadentechnik; Entriegelung und Sicherungen richten sich nach dem Geräteschild.',
  },
  'machine-hip-adduction': {
    scope: 'Adduktionsgerät im Sitzen.',
    setup: [
      'Stütze Füße und Rücken; stelle eine angenehme Startbreite mit den Oberschenkelinnenseiten an den Polstern ein.',
    ],
    movement: ['Führe die Beine langsam nach innen und kontrolliert zurück.'],
    checks: [
      'Halte die Griffe und nutze vor dem Aussteigen den Entriegelungsmechanismus.',
    ],
    mistakes: [
      'Übermäßige Startbreite: verringern.',
      'Rumpfschaukeln: gestützt bleiben.',
      'Aufschlagender Gewichtsblock: langsam zurückführen.',
    ],
    adaptation:
      'Herstellerbeispiel; die genauen Einstellbedienelemente unterscheiden sich je nach Gerät.',
  },
  'kettlebell-swing': {
    scope: 'Beidhändiger Hüftbeuge-Swing, kein Überkopf-Swing.',
    setup: [
      'Erlerne zuerst eine kontrollierte Hüftbeuge; greife eine gut kontrollierbare Kettlebell sicher und stehe stabil.',
    ],
    movement: [
      'Führe die Kugel nach hinten; strecke die Hüfte, sodass sie nach vorn steigt, und beuge die Hüfte für die Rückkehr.',
    ],
    checks: [
      'Halte die Wirbelsäule stabil; treibe aus der Hüfte an, statt mit den Armen zu heben.',
    ],
    mistakes: [
      'Kniebeuge: Hüfte zurückbeugen.',
      'Heben mit den Armen: Hüfte antreiben lassen.',
      'Zurücklehnen: aufrecht enden.',
    ],
  },
  plank: {
    scope: 'Unterarmstütz; zeitbasiertes Halten.',
    setup: [
      'Platziere die Ellbogen unter den Schultern, stütze die Zehen und spanne den Rumpf an.',
    ],
    movement: [
      'Hebe dich in eine gerade Körperlinie; atme beim Halten und senke sanft ab.',
    ],
    checks: [
      'Halte Kopf ausgerichtet und Hüfte auf einer Linie; beende, wenn du die Ausrichtung nicht halten kannst.',
    ],
    mistakes: [
      'Durchhängender Rücken: Haltezeit verkürzen.',
      'Hüfte zu hoch: neu ausrichten.',
      'Luft anhalten: gleichmäßig atmen.',
    ],
  },
  'hanging-knee-raise': {
    scope: 'Anheben gebeugter Knie im Hang.',
    setup: [
      'Greife eine sichere Stange und richte einen stabilen, in den Schultern gestützten Hang ein.',
    ],
    movement: [
      'Hebe die Knie mit sanftem Einrollen des Beckens; senke ohne Schwingen.',
    ],
    checks: [
      'Bewege kontrolliert aus Bauch und Becken und halte die Schultern unterstützt.',
    ],
    mistakes: [
      'Kicken: Hang neu stabilisieren.',
      'Beine fallenlassen: langsam senken.',
      'Nachlassender Griff: vor Kontrollverlust stoppen.',
    ],
    adaptation:
      'Eine konservative Hangeinstellung ergänzt die NASM-Hinweise zur Beckenkontrolle.',
  },
  'cable-crunch': {
    scope: 'Rumpfbeugung am Kabel; Körperhaltung nicht festgelegt.',
    setup: [
      'Richte ein hohes Kabel sicher ein und halte den Aufsatz neben dem Kopf bei stabiler Hüfte.',
    ],
    movement: [
      'Rolle die Rippen gegen den Widerstand zum Becken und kehre langsam zurück.',
    ],
    checks: [
      'Die Hände dienen überwiegend zum Halten des Aufsatzes, nicht zum Ziehen mit den Armen.',
    ],
    mistakes: [
      'Nur Hüftbeuge: Rippen bewegen.',
      'Ziehen mit den Armen: Hände stabil halten.',
      'Aufschlagender Gewichtsblock: Rückführung verlangsamen.',
    ],
    adaptation:
      'Die Quelle zeigt einen stehenden Crunch; kniende Versionen benötigen eine eigene stabile Einrichtung.',
  },
  'back-extension': {
    scope: 'Hüft- oder Rückenstreckung; Gerätegeometrie nicht festgelegt.',
    setup: [
      'Stütze bei einer Hüftstreckbank die oberen Oberschenkel mit dem Polster unterhalb der Hüfte und fixiere die Füße.',
    ],
    movement: [
      'Beuge dich mit stabilem Rumpf ab; richte dich bis zur geraden Körperlinie auf, nicht darüber hinaus.',
    ],
    checks: [
      'Stütze an einem sitzenden Lendenstreckgerät die Füße mit leicht gebeugten Knien und die Hüfte am Lendenpolster; stelle den Startumfang ein. Strecke den Rumpf gleichmäßig in die Stütze und kehre kontrolliert zurück; beachte dessen eigene Anleitung.',
    ],
    mistakes: [
      'Überstreckung: bei ausgerichtetem Körper stoppen.',
      'Schwingen: verlangsamen.',
      'Rundrücken unter Last: Umfang verringern.',
    ],
    adaptation:
      'Das Beispiel der Hüftbeugebank ist ausdrücklich benannt; es legt diese allgemeine ID nicht auf einen Gerätetyp fest.',
  },
  'dumbbell-shrug': {
    scope: 'Stehendes Schulterheben mit Kurzhanteln.',
    setup: ['Stehe stabil mit seitlich gehaltenen Hanteln und langen Armen.'],
    movement: ['Hebe die Schultern zu den Ohren und senke langsam.'],
    checks: ['Halte Kopf ausgerichtet, Handgelenke gerade und Rumpf stabil.'],
    mistakes: [
      'Schulterkreisen: vertikal bewegen.',
      'Ellbogenbeugung: Arme lang halten.',
      'Kopf vorschieben: Ausrichtung halten.',
    ],
  },
  'farmers-carry': {
    scope: 'Tragen zweier Kurzhanteln; distanzbasiert.',
    setup: [
      'Hebe die Gewichte kontrolliert und greife sie sicher neben der Hüfte; halte den Weg frei.',
    ],
    movement: [
      'Gehe gleichmäßig mit kurzen kontrollierten Schritten; wende vorsichtig und stelle die Gewichte kontrolliert ab.',
    ],
    checks: ['Bleibe aufrecht, atme und halte die Schultern auf einer Höhe.'],
    mistakes: [
      'Hastige Wendungen: verlangsamen.',
      'Seitliches Neigen: Last verringern.',
      'Versagender Griff: sicher stoppen.',
    ],
    adaptation:
      'Der seitliche Neutralgriff präzisiert die unklare Handflächenformulierung der Quelle; Entfernung ist keine Wiederholungszahl.',
  },
  'standing-cable-anti-rotation-press': {
    scope: 'Stehendes beidarmiges Anti-Rotations-Drücken; beide Seiten.',
    setup: [
      'Stehe seitlich zu einem Kabel auf Brusthöhe mit stabilen Füßen; halte den Griff vor der Brust.',
    ],
    movement: [
      'Drücke die Hände nach vorn und widerstehe der Drehung; führe zurück und wiederhole mit der anderen Seite zur Rolle.',
    ],
    checks: ['Halte Becken und Rippen nach vorn gerichtet.'],
    mistakes: [
      'Rumpfdrehung: Last verringern.',
      'Hohlkreuz: Rumpf anspannen.',
      'Schlaffes Kabel: Abstand ändern.',
    ],
    adaptation:
      'ACE-Hinweise für Band und Kabel sind an die Kabelkonfiguration des Katalogs angepasst.',
  },
  'bodyweight-step-up': {
    scope: 'Step-up ohne Zusatzlast; jedes Führungsbein.',
    setup: [
      'Wähle eine stabile Plattform, deren Höhe du kontrollierst; stelle den gesamten vorderen Fuß darauf.',
    ],
    movement: [
      'Steige gleichmäßig auf und kontrolliert ab; wiederhole mit jedem Führungsbein.',
    ],
    checks: ['Halte das Knie in Fußrichtung und vermeide Springen.'],
    mistakes: [
      'Hohe Plattform: Höhe verringern.',
      'Einknickendes Knie: Ausrichtung kontrollieren.',
      'Herunterfallen: langsam absteigen.',
    ],
    adaptation:
      'Unbelastete Anpassung des ACE-Kurzhantel-Step-ups; für diese ID ist kein externes Gewicht vorgesehen.',
  },
  'dumbbell-floor-glute-bridge': {
    scope: 'Kurzhantel-Hüftstreckung mit Bodenstütze.',
    setup: [
      'Lege dich mit gebeugten Knien und aufgestellten Füßen auf den Boden; stabilisiere eine Hantel quer über der Hüfte.',
    ],
    movement: ['Drücke die Füße nach unten und hebe die Hüfte; senke langsam.'],
    checks: ['Halte oberen Rücken auf dem Boden und Rippen kontrolliert.'],
    mistakes: [
      'Hohlkreuz: bei ausgerichtetem Körper stoppen.',
      'Rollendes Gewicht: sichern.',
      'Drücken mit dem Nacken: Kopf entspannt halten.',
    ],
  },
  'lying-barbell-triceps-extension': {
    scope: 'Langhantel-Ellbogenstreckung in Rückenlage.',
    setup: [
      'Lege dich mit gestützten Füßen auf eine Flachbank; greife geschlossen im Obergriff und halte die Stange über dem Kopf-/Brustbereich.',
    ],
    movement: [
      'Beuge die Ellbogen zum Absenken mit Abstand zum Kopf und strecke gleichmäßig.',
    ],
    checks: ['Halte Oberarme stabil und Handgelenke gerade.'],
    mistakes: [
      'Stange trifft den Kopf: Freiraum halten.',
      'Wandernde Ellbogen: Last verringern.',
      'Abgeknickte Handgelenke: mit Unterarmen ausrichten.',
    ],
  },
});
