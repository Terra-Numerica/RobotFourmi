
// calcule la puissanceforward en fonction de la hauteur de l'objet vue
// puis creer rajoute une rotation en fonction de la rotation varie entre 0 a 1 avec 0.5 le millieu et sur l'axe x

/**
 * minpower 30 30
 */
/**
 * Ce programe est concue pour les robot suiveurs.
 * 
 * Il est activé grace a la radio et le renvois au prochain:
 * 
 * Pour chaque programe robot faut modifier le nom robot2,robot3,robot4 au demarage et puis dans quand donnée et recue l'envois au robots prochain de la chaine.
 * 
 * Pour le suivis faut bien que l'id 1 de la huskylens camera soit appris voir doc sur huskylens Aicamera. Et que l'id 1 correspond au tag que le robot est sensé suivre.
 */

////////////MOVING FUNCTIONS////////////

// mouve robot forward with right speed : right(int 255), left speed : left (int 255)
function forward(right2: number, left2: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CW, left2)
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CW, right2)
}

// stop the robot mouvement and rotation
function stop() {
    DFRobotMaqueenPlus.mototStop(Motors.ALL)
}

// mouve robot backword with right speed : right(int 255), left speed : left (int 255)
function backword(right: number, left: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CCW, right)
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CCW, left)
}

//////////// RADIO & EVENT ////////////

// On/OFF de tous les robot --> update les autres aussi
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (activate) {
        robot_turnOff()
        radio.sendString("S")
    }
    else {
        radio.sendString("R")
        robot_turnOn()
    }
})

function robot_turnOn() {
    activate = true
    affichage_temporaire("R")
}

function robot_turnOff() {
    activate = false
    stop()
    affichage_temporaire("S")
}

radio.onReceivedValue(function (name, value) {
    if (name == "color_used") {
        //la couleur n'est alors plus dispo
        if (!color_dispo.removeElement(value)) {
            // Si la couleur a pas pu être retiré : mean problème
            stop()
            basic.clearScreen()
            basic.showString("E", 3000)
        }
    }
})

// running = update de l'état on/off
radio.onReceivedString(function (receivedString: string) {
    if (receivedString == "Run") {
        robot_turnOn()
    }
    if (receivedString == "Stop") {
        robot_turnOff()
    }
})
//////////// UTILITY ////////////

// Affiche pendant x secondes le message
function affichage_temporaire(msg: string, time: number = 500) {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}

//////////// INIT ////////////

function def_color() {
    huskylens.request()
    for (let i = 0; i < color_dispo.length; i++) {
        // Si repérage d'une couleur dispo
        if (huskylens.isAppear(color_dispo[i], HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            // save la couleur dans ce robot
            color_followed = color_dispo[i];
            //debug
            //affichage_temporaire(color_followed.toString())
            // préviens les autres robots que la couleur n'est plus dispo
            radio.sendValue("color_used", color_followed)
            break
        }
    }
}

//////////// MAIN ////////////
function cameramove() {
    huskylens.request()
    if (huskylens.isAppear(color_followed, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { // si repérage
        // X : numéro colonne sur l'écran --> 0 à 320 : moitié = 160
        // Y : numéro ligne --> 0 à 280
        // Hauteur max = environ 6/10 de l'écran ->3/5
        let height = huskylens.readeBox(1, Content1.height)
        //let widht = huskylens.readeBox(1,Content1.width) // Largeur : tou
        let rotation = huskylens.readeBox(1, Content1.xCenter)  // 0 
        // hauteur max environ 230
        // puissance maximal d'avancé = 80, réduit la puissance quand à proximité
        // let power_max = 80 - 80 * height / 230
        let power_max = power - power * height / max_height_y
        // Répartition de la puissance pour touner


        let powerL = power_max * rotation / screen_width
        let powerR = power_max - power_max * rotation / screen_width

        //gradient_ledV2(2, powerL)
        //gradient_ledV2(1, powerR)

        if (powerL > min_power_wheel || powerR > min_power_wheel) { // permet d'éviter le bruit des moteurs qui n'ont pas assez de power
            forward(powerR, powerL)
        }

    }
    else {
        lost()
    }
}



// les diodes révelent la puissance mise dans les roues
function gradient_ledV2(wheel: number, current_power: number) {
    let seuil = power / 3 // car 3 couleur différentes 

    if (current_power <= seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.RED)
    }
    else if (current_power <= 2 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.GREEN)
    }
    else if (current_power <= 3 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.BLUE)
    }

}

// les couleur ne peuvent pas être 
// allumage du même coté que la roue concérnée par le power
function gradient_led(wheel: number, current_power: number) {
    let seuil = power / 6 // car 6 couleur différentes 

    if (current_power <= seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.RED)
    }
    else if (current_power <= 2 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.YELLOW)
    }
    else if (current_power <= 3 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.GREEN)
    }
    else if (current_power <= 4 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.WHITH)
    }
    else if (current_power <= 5 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.CYAN)
    }
    else if (current_power <= 6 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.BLUE)
    }

}

//////////// UTILITY ////////////

// s'arrête + indique qu'il est perdu
function lost() {
    stop()
    basic.clearScreen()
    basic.showString("?")
}

////////////GLOBAL////////////

//couleur dispo à l'initialisation
let color_dispo = [1, 2, 3, 4, 5, 6]
// couleur que suivra le robots
let color_followed: number = null
// Etat du robot
let activate = false

/////////////////Constante//////////
// puissance global répartie sur les roues : 250
let power = 255 // 255 // maximum possible = 255
// hauteur maximal atteinte par la boite "color" sur l'écran 
let max_height_y = 230
// largeur de l'écran
let screen_width = 320
// Puissance minimal pour que les roues s'active : 
let min_power_wheel = 30

////////////SETUP////////////
huskylens.initI2c()
huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
//huskylens.initMode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
radio.setGroup(1)


DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBR, Color.WHITH)
DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBL, Color.WHITH)

////////////LOOP////////////
basic.forever(function () {
    // si activate
    if (activate) {
        //si color undef
        if (color_followed == null) {
            def_color()
        }//sinon
        else {//follow la couleur
            cameramove()
        }
    }//sinon, stop le robot
})