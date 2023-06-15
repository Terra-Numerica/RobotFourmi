input.onButtonPressed(Button.A, function () {
    radio.sendString("200")
    music.playTone(Note.CSharp, 50)
})
input.onButtonPressed(Button.B, function () {
    radio.sendString("201")
    music.playTone(Note.FSharp, 50)
})

input.onButtonPressed(Button.AB, () => {
    radio.sendString("198")
    music.playTone(Note.Bb3, 100)
})

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    radio.sendString("199")
    music.playTone(Note.F5, 100)
})

radio.setGroup(1)
