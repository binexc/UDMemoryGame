/*
 * Create a list that holds all of your cards
 */

let _gameIsInPlay = false //The game hasn't started yet
let _UnmatchedCellShowingIndex = -1

let _displayPaused = false

let _cardDeck = null
let _matchTotal = 0
let _movesCounter = 0
let _clockDisplay = null
let _gameStartTime = null
let _restartButton = null
let _clockIntervalObj = null
let _starRatingDisplay = null
let _missedSelectionCount = 0
let _movesCounterDisplay = null

const _maxStarRating = 6
const _numberOfMatchesForWin = 8
const _numberOfMovesPerHalfStarRating = 3

let _currentStarRating = _maxStarRating //Each star consist of 2 values. ie: 6 = 3 stars, 5 = 2 and a half stars, 4 = 2 stars

/*
    showingState:
        0 = Closed & Not showing its image
        1 = Open because you tapped on it and it's corresponding icon is not showing - Will auto close after a small timeout
        2 = Just Show. You tap on an item - it's opened showing. It's corresponding match is just show
        3 = Matched and remains showing its image.

        <li id="idx.li.0:0" class="card open show">
        <li id="idx.li.0:0" class="card match">
*/
let arrCellSelections = [
    {'showingState':0, 'imageName':'fa-diamond', 'parentCell':null, 'correspondingIndex':-1},//0:0
    {'showingState':0, 'imageName':'fa-paper-plane-o', 'parentCell':null, 'correspondingIndex':-1},//0:1
    {'showingState':0, 'imageName':'fa-anchor', 'parentCell':null, 'correspondingIndex':-1},//0:2
    {'showingState':0, 'imageName':'fa-bolt', 'parentCell':null, 'correspondingIndex':-1},//0:3
    {'showingState':0, 'imageName':'fa-cube', 'parentCell':null, 'correspondingIndex':-1},//1:0
    {'showingState':0, 'imageName':'fa-anchor', 'parentCell':null, 'correspondingIndex':-1},//1:1
    {'showingState':0, 'imageName':'fa-leaf', 'parentCell':null, 'correspondingIndex':-1},//1:2
    {'showingState':0, 'imageName':'fa-bicycle', 'parentCell':null, 'correspondingIndex':-1},//1:3
    {'showingState':0, 'imageName':'fa-diamond', 'parentCell':null, 'correspondingIndex':-1},//2:0
    {'showingState':0, 'imageName':'fa-bomb', 'parentCell':null, 'correspondingIndex':-1},//2:1
    {'showingState':0, 'imageName':'fa-leaf', 'parentCell':null, 'correspondingIndex':-1},//2:2
    {'showingState':0, 'imageName':'fa-bomb', 'parentCell':null, 'correspondingIndex':-1},//2:3
    {'showingState':0, 'imageName':'fa-bolt', 'parentCell':null, 'correspondingIndex':-1},//3:0
    {'showingState':0, 'imageName':'fa-bicycle', 'parentCell':null, 'correspondingIndex':-1},//3:1
    {'showingState':0, 'imageName':'fa-paper-plane-o', 'parentCell':null, 'correspondingIndex':-1},//3:2
    {'showingState':0, 'imageName':'fa-cube', 'parentCell':null, 'correspondingIndex':-1}//3:3
];

document.addEventListener('DOMContentLoaded', function () {
    _cardDeck = document.querySelector('.deck')
    _restartButton = document.querySelector('.restartBtn')
    _clockDisplay = document.querySelector('#clockDisplay')
    _starRatingDisplay = document.querySelector('.starsDisplay')
    _movesCounterDisplay = document.querySelector('.movesCounterDisplay')

    _cardDeck.addEventListener('click', userSelectionMade)
    _restartButton.addEventListener('click', resetAndRestartANewGame)

    _movesCounterDisplay.innerText = "0 Moves"

    populateAllIndexesWithParentNodes()
});

function resetAndRestartANewGame(evt) {
    if ((evt !== null) && (evt.target.parentNode !== _restartButton)) {
        return
    }

    if (_clockIntervalObj !== null) {
        window.clearInterval(_clockIntervalObj)
    }

    _matchTotal = 0
    _gameIsInPlay = false
    _gameStartTime = null
    _displayPaused = false
    _UnmatchedCellShowingIndex = -1

    configureStarsDisplay(0)
    _clockDisplay.innerText = '00:00:00'

    _movesCounter = 0
    _missedSelectionCount = 0
    _movesCounterDisplay.innerText = "0 Moves"
    shuffle(arrCellSelections)
}

/*
    This function is called only once when the page loads. Therefore, all nodes
    are already set whenever you start manipulating the array.
 */
function populateAllIndexesWithParentNodes() {

    let idx = 0

    for (var deckNode of _cardDeck.childNodes) {
        if(deckNode.id === undefined) {
            continue
        }

        arrCellSelections[idx].parentCell = deckNode

        idx += 1
    }
}

function didWin() {
    let displayString = "Congratulations! You've Won!\n"

    displayString += "Your time to complete the game was: " + getTimeString(true) + '\nYou\'ve finished with a Star rating of '

    switch(_currentStarRating) {
        case _maxStarRating:
            displayString += '3 Stars!!!'
            break
        case _maxStarRating - 1:
            displayString += '3!!!'
            break
        case _maxStarRating - 2:
            displayString += '2 Stars!!'
            break
        case _maxStarRating - 3:
            displayString += '2!!'
            break
        case _maxStarRating - 4:
            displayString += '1 Star!'
            break
        case _maxStarRating - 5:
            displayString += '1 Star!'
            break
        default:
            displayString += '1 Stars! Keep practicing...'
    }

    displayString += '\n\nPress \"Cancel\" to go back and see your game or \"OK\" to start another game'

    _gameIsInPlay = false

    if(window.confirm(displayString) == true) {
        resetAndRestartANewGame(null)
    }
}

/*
 * Display the cards on the page
 *   - shuffle the list of cards using the provided "shuffle" method below
 *   - loop through each card and create its HTML
 *   - add each card's HTML to the page
 */

// Shuffle function from http://stackoverflow.com/a/2450976
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        array[currentIndex].correspondingIndex = -1
        temporaryValue = array[currentIndex].imageName
        array[currentIndex].imageName = array[randomIndex].imageName
        array[randomIndex].imageName = temporaryValue
    }

    let idx = -1
    let innerIdx

    //This call with a nested loop only happens once at the game reset.
    //This will save us from looping every single time a user makes a selection.
    //In the long run, this saves us a ton!
    for(let cellInfo of array){
        idx++

        cellInfo.showingState = 0
        cellInfo.parentCell.className = "card"
        cellInfo.parentCell.childNodes[1].className = "fa " + cellInfo.imageName

        if(cellInfo.correspondingIndex !== -1) {
            continue //Already matched
        }

        innerIdx = 0
        for(let partneringCell of array) {
            if(partneringCell.imageName === cellInfo.imageName) {
                cellInfo.correspondingIndex = innerIdx
                partneringCell.correspondingIndex = idx
                break
            }

            innerIdx++
        }
    }

    return array
}

/*
 * set up the event listener for a card. If a card is clicked:
 *  - display the card's symbol (put this functionality in another function that you call from this one)
 *  - add the card to a *list* of "open" cards (put this functionality in another function that you call from this one)
 *  - if the list already has another card, check to see if the two cards match
 *    + if the cards do match, lock the cards in the open position (put this functionality in another function that you call from this one)
 *    + if the cards do not match, remove the cards from the list and hide the card's symbol (put this functionality in another function that you call from this one)
 *    + increment the move counter and display it on the page (put this functionality in another function that you call from this one)
 *    + if all cards have matched, display a message with the final score (put this functionality in another function that you call from this one)
 */
function userSelectionMade(evt) {
    if( (evt.target.nodeName === "UL") || (_displayPaused == true) ){
        return
    }

    if(_gameStartTime === null) {
        resetAndRestartANewGame(null)

        _gameStartTime = performance.now() //Start the timer when the user makes their first move
        _gameIsInPlay = true
        _clockIntervalObj = window.setInterval(updateCurrentPlayTime, 1000);
    }

    var childNode = null
    var parentNode = null

    //First tests to see if you clicked the actual picture.
    if(evt.target.nodeName === 'I') {
        childNode = evt.target
        parentNode = evt.target.parentNode
    }
    else if(evt.target.nodeName === 'LI') {
        parentNode = evt.target
        childNode = evt.target.childNodes[1]
    }

    if( (parentNode === null) || (childNode === null)) {
        return
    }

    if(processSelection(parentNode, childNode) === false) {
        return
    }

    _movesCounter++

    if(_movesCounter === 1) {
        _movesCounterDisplay.innerText =  _movesCounter + " Move"
        return
    }

    _movesCounterDisplay.innerText =  _movesCounter + " Moves"
}

function configureStarsDisplay(incrementDecrementAmount) {

    let currentStar = 0 //0 Means to manipulate ALL the stars
    let starElmt;

    if(incrementDecrementAmount < 0) {
        _currentStarRating--
    }
    else if(incrementDecrementAmount == 0) {
        _currentStarRating = _maxStarRating //This is your reset state
    }
    else {
        _currentStarRating++
    }

    //Get your moves range. If the value is 0, you're resetting
    //the game and you need to fill in all three stars.
    if (incrementDecrementAmount === 0) {
        //Reset all three stars to full stars
        for(var i = 0; i < _starRatingDisplay.children.length; i++) {

            _starRatingDisplay.children[i].innerHTML = '<i class=\"fa fa-star\"></i>'
        }

        return
    }

    //Star counts go from left to right - including right to left languages. This isn't placement - it's status
    //switch(_movesCounter) {
    switch(_missedSelectionCount) {
        case _numberOfMovesPerHalfStarRating * 1: case _numberOfMovesPerHalfStarRating * 2:
            currentStar = 3
            break
        case _numberOfMovesPerHalfStarRating * 3: case _numberOfMovesPerHalfStarRating * 4:
            currentStar = 2
            break
        case _numberOfMovesPerHalfStarRating * 5: case _numberOfMovesPerHalfStarRating * 6:
            //currentStar = 1
            return//Never go below a single star
            break
        default:
            return //You only need to change when the modulus == 0, and also, don't give your users crazy negative bad ratings!
    }

    starElmt = _starRatingDisplay.children[currentStar - 1]

    switch(_currentStarRating) {
        case _maxStarRating:
            starElmt.innerHTML = '<i class="fa fa-star"></i>'
            break
        case _maxStarRating - 1:
            break
        case _maxStarRating - 2:
            starElmt.innerHTML = '<i class="fa fa-star-o"></i>'
            break
        case _maxStarRating - 3:
            break
        case _maxStarRating - 4:
            starElmt.innerHTML = '<i class="fa fa-star-o"></i>'
            break
        case _maxStarRating - 5:
            break
        default:
            starElmt.innerHTML = '<i class="fa fa-star-o"></i>'
    }
}

function getTimeString(withWords) {
    //Remember, you're getting millisecond accuracy.
    let seconds = Math.round((performance.now() - _gameStartTime) / 1000.0)
    let minutes = Math.trunc(seconds / 60)
    let hours = Math.trunc(minutes / 60)

    if (hours > 0) {
        minutes %= 60
    }

    if (minutes > 0) {
        seconds %= 60
    }

    let strTimeDuration

    if (withWords === true) {
        strTimeDuration = (hours > 0) ? (hours + ((hours !== 1) ? " hours " : " hour ")) : ""
        strTimeDuration += (minutes > 0) ? (minutes + ((minutes !== 1) ? " minutes and " : " minute and ")) : ""
        strTimeDuration += seconds + ((seconds !== 1) ? " seconds" : " second")
    }
    else {
        strTimeDuration = `${(hours < 10) ? "0" : ""}${hours}${":"}`
        strTimeDuration += `${(minutes < 10) ? "0" : ""}${minutes}${":"}`
        strTimeDuration += `${(seconds < 10) ? "0" : ""}${seconds}`
    }

    return strTimeDuration
}

function updateCurrentPlayTime() {
    const timeStr = getTimeString(false)

    _clockDisplay.innerText = timeStr
}

function processSelection(parent, child) {
    let parentID = parent.id.split('.')
    let childID = child.id.split('.')

    if(parentID[2] !== childID[2]) {
        return false
    }

    let indexer
    let incrementer = 0

    const indexPath = parentID[2].split(':')

    const row = indexPath[0]
    const col = indexPath[1]

    //  0     1     2     3     4     5     6     7   ...
    //[0:0],[0:1],[0:2],[0,3],[1,0],[1,1],[1,2],[1,3]...
    switch (row) {
        case "0": //Start at 0:0
            break
        case "1":
            incrementer += 4 //Start at 1:0
            break
        case "2":
            incrementer += 8 //Start at 2:0
            break
        case "3":
            incrementer += 12 //Start at 3:0
            break
        default:
            break
    }

    indexer = Number(col)
    const arrIndx = incrementer + indexer

    //3 means the selection is already matched - so just move on!
    if(arrCellSelections[arrIndx].showingState === 3) {
        return false
    }

    return processSelectedIndex(parent, child, arrIndx)
}

/*
    NOTE: Will ONLY return true if the moves counter needs to be incremented. The moves are incremented
            only when the second cell is selected - and NOT each time a particular cell is selected.
    showingState:
        0 = Closed & Not showing its image
        1 = Open & Showing for reference - Will auto close after a small timeout
        2 = Matched and remains showing its image.
*/
function processSelectedIndex(parentNode, childNode, arrIndx) {

    if(arrCellSelections[arrIndx].showingState !== 0) {
        return false
    }

    if (_UnmatchedCellShowingIndex === -1) {
        _UnmatchedCellShowingIndex = arrIndx
        arrCellSelections[arrIndx].showingState = 1
        arrCellSelections[arrIndx].parentCell.className = "card show"
        return false
    }
    else if(arrIndx === _UnmatchedCellShowingIndex) {
        arrCellSelections[_UnmatchedCellShowingIndex].showingState = 0
        arrCellSelections[_UnmatchedCellShowingIndex].parentCell.className = "card"
        _UnmatchedCellShowingIndex = -1
        return false
    }

    //Means you have an unmatched cell displaying - and you've tapped a separate cell.
    //That cell either matches...

    //This is where the nested loop of the shuffles saves us a ton of time...
    if(arrCellSelections[_UnmatchedCellShowingIndex].correspondingIndex === arrIndx) {
        //WE HAVE A MATCH!!!!!!!
        arrCellSelections[arrIndx].showingState = 3
        arrCellSelections[_UnmatchedCellShowingIndex].showingState = 3
        arrCellSelections[arrIndx].parentCell.className = "card match"
        arrCellSelections[_UnmatchedCellShowingIndex].parentCell.className = "card match"

        _UnmatchedCellShowingIndex = -1
        _matchTotal += 1

        if(_matchTotal == _numberOfMatchesForWin) {
            if (_clockIntervalObj !== null) {
                window.clearInterval(_clockIntervalObj)
            }

            //Give the UI a moment to update before freezing it with a popup.
            setTimeout(function(){
                didWin()
            }, 400)
        }

        return true
    }

    //OR that cell does NOT match...

    _displayPaused = true
    _missedSelectionCount++

    //We'll update the star rating only as the user misses a match click to a pairing.
    if( ((_missedSelectionCount % _numberOfMovesPerHalfStarRating) === 0) && (_currentStarRating > 0) ) {
        configureStarsDisplay(-1)
    }

    arrCellSelections[arrIndx].showingState = 2
    arrCellSelections[_UnmatchedCellShowingIndex].showingState = 2

    arrCellSelections[arrIndx].parentCell.className = "card open show"
    arrCellSelections[_UnmatchedCellShowingIndex].parentCell.className = "card open show"

    //Do a quick show of the match and disappear
    setTimeout(function(){
        _displayPaused = false
        arrCellSelections[arrIndx].parentCell.className = "card"
        arrCellSelections[_UnmatchedCellShowingIndex].parentCell.className = "card"

        arrCellSelections[arrIndx].showingState = 0
        arrCellSelections[_UnmatchedCellShowingIndex].showingState = 0

        _UnmatchedCellShowingIndex = -1
    }, 500)

    return true
}

