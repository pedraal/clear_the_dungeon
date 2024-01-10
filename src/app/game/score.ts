export class Score {
  value: number
  personnalBest: number
  constructor() {
    this.value = 0

    const personnalBest = localStorage.getItem('personnalBest')
    this.personnalBest = personnalBest ? parseInt(personnalBest) : 0

    this.renderScore()
  }

  incrementBy(points: number) {
    this.value += points
    if (this.value > this.personnalBest) {
      this.personnalBest = this.value
      localStorage.setItem('personnalBest', this.personnalBest.toString())
    }

    this.renderScore()
  }

  reset() {
    this.value = 0
    this.renderScore()
  }

  renderScore() {
    for (const el of document.querySelectorAll('.score')) el.innerHTML = this.value.toString()
    for (const el of document.querySelectorAll('.personnal-best')) el.innerHTML = this.personnalBest.toString()
  }
}
