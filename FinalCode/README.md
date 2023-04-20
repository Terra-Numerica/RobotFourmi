# Projet : Robots fourmis
# Lucas LYON - M1 Informatique

Fusion_leader_follower.js
-------------------------
This file should be upload on each robot who has to be connected.

Parametres pertinent à modifier : 

In the part constantes of "VALUE"
- MAX_POWER : decrease do limit max power reachable
- UPGRADE_SPEED_POWER : increase to increase power add at each speed input 
- FACTOR_ROTATION : increase to increase the rotation at each rotation input
- MAX_DIFFERENCIAL_RATIO : decrease do increase the maximum degree of rotation acceptable

// INTERACTION DELAY
const DELAY_INPUT_IR = 500; //millisecond  // évite de spmmer la télécommande
const DELAY_LOST_QR = 1000 // ms // évite de dire "lost" (et donc de tout stopper) à la moindre perte de contacte
const DELAY_LOST_DEFINITIF = 2500 // ms

Debogage_IR.js
--------------
This file is made to see the different values send from an infrared remote controller.
It allows you to configure IR constants to easily adapt to different remote controllers.

