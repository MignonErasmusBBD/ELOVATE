import type { LessonUnit } from "../types";

export function getLessonUnits(courseTitle: string): LessonUnit[] {
  return [
    {
      id: "introduction",
      title: "Introduction",
      paragraphs: [
        `Welcome to ${courseTitle}. This lesson introduces the Observer pattern: a way for one object to notify many others when its state changes, without those objects being tightly coupled.`,
        "You will learn how to recognise the pattern, how it is structured, the problem it solves, and how to apply it in a small code example.",
      ],
    },
    {
      id: "identification",
      title: "Identification",
      paragraphs: [
        "You can identify Observer when a subject must tell several dependents about a change, but should not hard-code who those dependents are.",
        "Look for publish-subscribe relationships, event listeners, and UI or services that update whenever a model changes. If adding a new listener currently means editing the subject, Observer is a strong fit.",
      ],
    },
    {
      id: "structure",
      title: "Structure",
      paragraphs: [
        "A subject keeps a list of observers and offers attach, detach, and notify. Each observer implements a simple update contract. When the subject’s state changes, it walks that list and lets every observer react in its own way.",
      ],
      codeSample: `type Observer = {
  update: () => void;
};

class Subject {
  private observers: Observer[] = [];

  attach(observer: Observer) {
    this.observers.push(observer);
  }

  notify() {
    for (const observer of this.observers) {
      observer.update();
    }
  }
}`,
    },
    {
      id: "problem",
      title: "Problem",
      paragraphs: [
        "Without Observer, the subject tends to know every dependent by name. Completing a lesson unit might call the dashboard, the badge service, and the email sender directly.",
        "That coupling makes the subject grow every time a new listener appears, and it becomes harder to test or reuse. The dependents cannot opt in or out without changing the subject itself.",
      ],
    },
    {
      id: "example",
      title: "Example",
      paragraphs: [
        "Imagine a course progress tracker. When you complete a unit, the tracker notifies whatever is subscribed: the lesson sidebar can mark the unit done, a dashboard can refresh completion, and a notification service can send a short confirmation.",
        "None of those listeners is named inside the tracker’s complete-unit method. They subscribe when they are ready and unsubscribe when they are not.",
      ],
    },
    {
      id: "exercise",
      title: "Exercise",
      paragraphs: [
        "Work through these prompts to check that the Observer structure is clear. You do not need to submit answers on this page.",
      ],
      exercises: [
        "Name the two core participants in Observer and one responsibility of each.",
        "Describe what happens in the subject when a new observer is attached, then when notify runs.",
        "Sketch a notify method that walks a list of observers and calls update on each one.",
        "Give one reason a lesson dashboard should subscribe to progress instead of being called directly from the subject.",
      ],
    },
  ];
}
