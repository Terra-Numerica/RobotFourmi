# main.js

Regroupe à la fois le code des robots suiveurs et du robot leader
Bouton B : fait automatiquemet zigzager le robot.
Bouton Logo : active/désactive le robot
Bouton A : définit le robot comme un leader

Les robots peuvent aussi être télécommander :
- par les flèches directionnelles d'une télécommande infrarouge (IR).
- par une autre carte micro-bit ayant reçu le code TelecommandeRadio.js

Les robots ne détecte plus les QR codes (de 7cm) : 
- au dela de un mètre.
- en cas de forte/faible luminosité
- for contraste (couloir sombre + porte très éclairé)
- en case de reflet (sol lisse / fenêtre/...)

# BrouillonLeaderDerivee.js

Contient un brouillon testant la pertinence de calcule de dérivé