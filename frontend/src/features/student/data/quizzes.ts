import type { PracticeQuiz, PracticeQuizQuestion } from "../types";

const observerPracticeQuestions: PracticeQuizQuestion[] = [
  {
    id: "q1",
    prompt: "How do you make observers receive priority-based notifications?",
    options: [
      { id: "A", label: "Use std::priority_queue<Observer*>" },
      { id: "B", label: "Sort observers by priority before notifying" },
      { id: "C", label: "Maintain separate lists per priority level" },
      { id: "D", label: "All are valid approaches" },
    ],
    correctOptionId: "D",
    explanation:
      "Priority notifications can use a priority queue, sort before each notification, or maintain priority-grouped lists. The best choice depends on how often priorities change.",
    topic: "Code Implementation",
    bloomLevel: "Apply",
    difficulty: "Medium",
  },
  {
    id: "q2",
    prompt: "What is the main problem the Observer pattern solves?",
    options: [
      { id: "A", label: "Objects need to inherit from multiple classes" },
      {
        id: "B",
        label:
          "A subject must notify dependents without knowing them by name",
      },
      { id: "C", label: "Database queries run too slowly" },
      { id: "D", label: "UI layouts need responsive breakpoints" },
    ],
    correctOptionId: "B",
    explanation:
      "Observer decouples a subject from its dependents so it can broadcast state changes without hard-coding who listens.",
    topic: "Problem",
    bloomLevel: "Understand",
    difficulty: "Easy",
  },
  {
    id: "q3",
    prompt: "Which participants belong in a classic Observer structure?",
    options: [
      { id: "A", label: "Controller and ViewModel only" },
      { id: "B", label: "Subject, ConcreteSubject, Observer, ConcreteObserver" },
      { id: "C", label: "Factory and Product" },
      { id: "D", label: "Proxy and RealSubject only" },
    ],
    correctOptionId: "B",
    explanation:
      "The subject manages observers; concrete subjects hold state; observers define update; concrete observers react to changes.",
    topic: "Participants",
    bloomLevel: "Remember",
    difficulty: "Easy",
  },
  {
    id: "q4",
    prompt: "What should a subject do when its state changes?",
    options: [
      { id: "A", label: "Call each listener by hard-coded name" },
      { id: "B", label: "Notify attached observers through a shared update contract" },
      { id: "C", label: "Restart the application process" },
      { id: "D", label: "Delete all observers immediately" },
    ],
    correctOptionId: "B",
    explanation:
      "After state changes, the subject walks its observer list and calls update so each listener can react independently.",
    topic: "Structure",
    bloomLevel: "Apply",
    difficulty: "Easy",
  },
  {
    id: "q5",
    prompt:
      "Why is hard-coding the dashboard, badge service, and email sender inside a progress tracker a smell?",
    options: [
      { id: "A", label: "It makes the tracker tightly coupled to every dependent" },
      { id: "B", label: "It improves compile times" },
      { id: "C", label: "It removes the need for testing" },
      { id: "D", label: "It guarantees observers run in parallel" },
    ],
    correctOptionId: "A",
    explanation:
      "Every new listener forces edits to the tracker. Observer lets dependents subscribe without changing the subject.",
    topic: "Problem",
    bloomLevel: "Analyze",
    difficulty: "Medium",
  },
  {
    id: "q6",
    prompt: "When should an observer detach from a subject?",
    options: [
      { id: "A", label: "Never; observers must stay forever" },
      {
        id: "B",
        label: "When it no longer needs updates, such as when a screen unmounts",
      },
      { id: "C", label: "Only after the subject is deleted from disk" },
      { id: "D", label: "Before the first notify call" },
    ],
    correctOptionId: "B",
    explanation:
      "Detach keeps the subject from notifying listeners that are gone, which avoids leaks and stale updates.",
    topic: "Explanation",
    bloomLevel: "Apply",
    difficulty: "Medium",
  },
  {
    id: "q7",
    prompt:
      "In a course progress example, what is a good Observer relationship?",
    options: [
      {
        id: "A",
        label:
          "The tracker notifies subscribed sidebar, dashboard, and notification services",
      },
      { id: "B", label: "The sidebar directly mutates the tracker’s private fields" },
      { id: "C", label: "The tracker imports every UI component by path" },
      { id: "D", label: "Observers call each other instead of the subject" },
    ],
    correctOptionId: "A",
    explanation:
      "Completing a unit can notify any subscribed listeners without naming them inside the tracker’s complete method.",
    topic: "Example",
    bloomLevel: "Apply",
    difficulty: "Medium",
  },
  {
    id: "q8",
    prompt: "What does the Observer interface typically define?",
    options: [
      { id: "A", label: "A single update method observers implement" },
      { id: "B", label: "SQL table schemas for each listener" },
      { id: "C", label: "HTTP status codes for notify failures" },
      { id: "D", label: "CSS classes for selected options" },
    ],
    correctOptionId: "A",
    explanation:
      "Observers share a simple update contract so the subject can notify them uniformly.",
    topic: "Identification",
    bloomLevel: "Remember",
    difficulty: "Easy",
  },
  {
    id: "q9",
    prompt: "Which statement about notify is correct?",
    options: [
      { id: "A", label: "Notify decides exactly how each UI should redraw" },
      {
        id: "B",
        label:
          "Notify announces change; each observer decides how to react",
      },
      { id: "C", label: "Notify must block until the user closes the app" },
      { id: "D", label: "Notify can only run once per application lifetime" },
    ],
    correctOptionId: "B",
    explanation:
      "The subject broadcasts that something changed. Each concrete observer reads what it needs and updates itself.",
    topic: "Explanation",
    bloomLevel: "Understand",
    difficulty: "Medium",
  },
  {
    id: "q10",
    prompt: "How can you identify Observer in existing code?",
    options: [
      { id: "A", label: "Only when a class uses the word Factory" },
      {
        id: "B",
        label:
          "Publish-subscribe, event listeners, or models that update many UIs",
      },
      { id: "C", label: "Whenever two classes share a package name" },
      { id: "D", label: "Only in languages without classes" },
    ],
    correctOptionId: "B",
    explanation:
      "Look for subjects that broadcast to dependents and for code where adding a listener currently means editing the subject.",
    topic: "Identification",
    bloomLevel: "Analyze",
    difficulty: "Hard",
  },
];

export function getPracticeQuiz(courseId: string): PracticeQuiz {
  return {
    courseId,
    questions: observerPracticeQuestions,
  };
}
