import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type QuizQuestion = {
  question: string;
  answer: string;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'date';
  choices?: string[];
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly heroTitle = 'Boldog karácsonyt tesóm neked és Bálintnak is!';
  readonly heroSubtitle =
    'Töltsd ki a személyes mini kvízt, és kiderül, hol vár a közös ajándékotok.';

  readonly questions: QuizQuestion[] = [
    {
      question: 'Drága barátod születésnapja?',
      answer: '2000-08-03',
      hint: 'A naptárban 2000.08.03. szerepel – válaszd ki a dátumot a mezőben.',
      type: 'date'
    },
    {
      question: 'Első személyes találkozónk napja?',
      answer: '2024-04-17',
      hint: 'Kalendáriumban így jegyeztük fel: 2024. 04. 17.',
      type: 'date'
    },
    {
      question: 'Milyen alkoholból fogyasztottunk a legtöbbet?',
      answer: 'bor',
      hint: 'Pihe-puha beszélgetéseink hű társa.',
      choices: ['sör', 'bor', 'pálinka', 'vodka']
    },
    {
      question: 'Mi a kedvenc italom?',
      answer: 'whiskey',
      hint: 'Jégen az igazi.',
      choices: ['whiskey', 'rum', 'cola', 'kávé']
    },
    {
      question: 'Segges vagy melles vagyok?',
      answer: 'melles'
      ,choices: ['segges', 'melles']
    },
    {
      question: 'Kedvenc közös sorozatunk?',
      answer: 'the office'
      ,choices: ['the office', 'friends', 'black mirror', 'sherlock']
    },
    {
      question: 'Melyik testrészedet irigylem, mint egy kutya?',
      answer: 'vádli',
      hint: 'Futásoknál mindig szóba kerül.',
      choices: ['vádli', 'váll', 'kar', 'láb']
    },
    {
      question: 'Mit írt Mike nagyinak a megjegyzésbe, mikor utalt neki?',
      answer: 'fagyira'
      ,choices: ['köszi', 'fagyira', 'üdv', 'sima']
    },
    {
      question: 'Melyik a kedvenc közös meme-ünk, amit Teamsen állandóan küldesz?',
      answer: 'side-eye-suspicious.png',
      choices: ['side-eye-suspicious.png', 'roll-safe-meme-1.jpg', 'images.png', 'images.jpeg']
    },
    {
      question: 'Ki a munkahelyi crush-unk?',
      answer: 'Varga Lilla'
      ,choices: ['Varga Lilla', 'dvadfb Kinga (fasz tudja mi a vezetékneve)', 'Béla felesége Anett', 'Nincs']
    },
    {
      question: 'Legidegesítőbb kolléga?',
      answer: 'Rimmel Botond'
      ,choices: ['Rimmel Botond', 'Ferenczi John', 'Hegedüs Patrik', 'Szalai Zsombor']
    },
    {
      question: 'Mire bukkantunk egyszer, mikor a Lurdy-ba siettünk edzeni?',
      answer: 'ingyen fagyira'
      ,choices: ['ingyen fagyira', 'lejárt jegyre', 'parkolóra', 'üdítő automatára']
    },
    {
      question: 'Ki a legjobb barátom?',
      answer: 'te tesómsz'
      ,choices: ['te tesómsz']
    }
  ];

  currentIndex = 0;
  userAnswer = '';
  feedback: 'correct' | 'incorrect' | 'missing' | null = null;
  giftUnlocked = false;
  giftOpened = false;
  // Multiple-choice state
  currentChoices: string[] = [];
  selectedChoice: string | null = null;
  incorrectAttempts = 0;
  isSending = false;

  get totalQuestions(): number {
    return this.questions.length;
  }

  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get progressValue(): number {
    const completed = this.giftUnlocked ? this.totalQuestions : this.currentIndex;
    const bonus = this.feedback === 'correct' && !this.giftUnlocked ? 1 : 0;
    return ((completed + bonus) / this.totalQuestions) * 100;
  }

  get showNextButton(): boolean {
    return this.feedback === 'correct' && !this.giftUnlocked && this.currentIndex < this.totalQuestions - 1;
  }
  ngOnInit(): void {
    this.setChoicesForCurrentQuestion();
  }

  private setChoicesForCurrentQuestion(): void {
    this.selectedChoice = null;
    if (this.currentQuestion.type === 'date') {
      this.currentChoices = [];
      return;
    }

    const correct = this.currentQuestion.answer;
    const explicit: string[] | undefined = (this.currentQuestion as any).choices;
    let choices: string[] = [];
    if (explicit && explicit.length) {
      choices = [...explicit];
    } else {
      const others = this.questions
        .map((q) => q.answer)
        .filter((a, i) => i !== this.currentIndex && a !== correct);
      const distractors: string[] = [];
      for (const a of others) {
        if (distractors.length >= 3) break;
        if (!distractors.includes(a)) distractors.push(a);
      }
      choices = [correct, ...distractors].slice(0, Math.min(4, 1 + distractors.length));
    }
    this.currentChoices = this.shuffle(choices);
  }

  selectChoice(value: string): void {
    this.selectedChoice = value;
    this.userAnswer = value;
    // Do not auto-submit; user must click the "Válasz elküldése" button
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  isImage(opt: string): boolean {
    return /\.(png|jpe?g)$/i.test(String(opt));
  }

  submitAnswer(): void {
    if (this.giftUnlocked) {
      return;
    }

    const isDateQuestion = this.currentQuestion.type === 'date';
    if (isDateQuestion) {
      if (!this.userAnswer || !String(this.userAnswer).trim()) {
        this.feedback = 'missing';
        return;
      }
    } else {
      const provided = this.selectedChoice ?? this.userAnswer;
      if (!provided || !String(provided).trim()) {
        this.feedback = 'missing';
        return;
      }
      this.userAnswer = String(provided);
    }

    const isCorrect = isDateQuestion
      ? String(this.userAnswer) === this.currentQuestion.answer
      : this.normalize(this.userAnswer) === this.normalize(this.currentQuestion.answer);

    if (isCorrect) {
      this.feedback = 'correct';
      if (this.currentIndex === this.totalQuestions - 1) {
        this.giftUnlocked = true;
      }
    } else {
      this.feedback = 'incorrect';
      this.incorrectAttempts += 1;
      if (this.incorrectAttempts >= 3) {
        alert('Három hibás válasz összesen — a teszt újrakezdődik.');
        this.restartQuiz();
        return;
      }
    }
  }

  goToNextQuestion(): void {
    if (!this.showNextButton) {
      return;
    }
    this.currentIndex += 1;
    this.userAnswer = '';
    this.feedback = null;
    this.setChoicesForCurrentQuestion();
  }

  openGift(): void {
    if (this.giftUnlocked) {
      this.giftOpened = true;
    }
  }

  async sendGiftByEmail(): Promise<void> {
    this.isSending = true;
    try {
      const attachments = ['gift1.pdf', 'gift2.pdf'];
      const res = await fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Email send failed');
      alert('E-mail elküldve.');
    } catch (err) {
      console.error(err);
      alert('Hiba történt az e-mail küldése közben: ' + String(err));
    } finally {
      this.isSending = false;
    }
  }

  async sendTestEmail(): Promise<void> {
    this.isSending = true;
    try {
      const attachments = ['gift1.pdf', 'gift2.pdf'];
      const to = 'sztankibandi@gmail.com';
      const subject = 'Boldog karácsonyt!';
      const text = 'Boldog Karácsonyt kedves barátom — neked is és Bálintnak is!';
      const html = `<p>Boldog Karácsonyt kedves barátom — neked is és Bálintnak is!</p>`;

      const res = await fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments, to, subject, text, html })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Email send failed');
      alert('Ajándék e-mail elküldve.');
    } catch (err) {
      console.error(err);
      alert('Hiba történt a teszt e-mail küldése közben: ' + String(err));
    } finally {
      this.isSending = false;
    }
  }

  restartQuiz(): void {
    this.currentIndex = 0;
    this.userAnswer = '';
    this.feedback = null;
    this.giftUnlocked = false;
    this.giftOpened = false;
    this.incorrectAttempts = 0;
    this.setChoicesForCurrentQuestion();
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase('hu-HU')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '')
      .trim();
  }
}
