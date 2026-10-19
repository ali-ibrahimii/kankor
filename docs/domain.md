# Business Domain & Terminology

This document describes the educational context and domain objects representing the core logic of Abzar Kankor.

---

## 1. Domain Overview

Abzar Kankor is designed for the high school education system in Afghanistan. Understanding the academic calendar, grading structure, and examination models is critical to building correct database relationships and user layouts.

---

## 2. Core Domain Models

### 1. School (Curriculum Study)
- **Grades**: Grades 10, 11, and 12 represent the final high school tier, which forms the syllabus of the Kankor exam.
- **Subjects**: Science subjects (Physics, Chemistry, Biology, Mathematics) and humanities/language modules.
- **Structure**: `Course` -> `Chapter` -> `Lesson` (Video + Notes/Slides).

### 2. Spaced Repetition (Leitner Flashcards)
- **The Leitner System**: Cards are organized into boxes based on memory retention. Correct reviews push cards to higher boxes (longer interval before next check), while incorrect reviews push them back to Box 1 (frequent reviews).
- **Core Entities**:
  - `Deck`: A collection of flashcards related to a specific textbook or subject.
  - `Flashcard`: A question/answer prompt pair.
  - `Review Session`: Keeps track of user success rates, card box locations, and next-review timestamps.

### 3. Tests & Assessments
- **Mock Kankor**: Simulation of the national Kankor entrance exam. Features a standardized count of questions across multiple subjects (including mathematics, natural sciences, social sciences, and literature), running under a strict time limit.
- **Subject-based tests**: Mini-practice quizzes specific to high school books.

### 4. Digital Library
- **Categories**: Textbook files, solved Kankor booklets, and academic resources.
- **Filtering**: Structured by academic fields, specialized studies, and educational levels.

---

## 3. Domain Glossary

- **Kankor (کانکور)**: The Afghan national university entrance examination.
- **Deck**: A container of related Flashcards.
- **Leitner System**: A learning schedule mapping cards to specific interval boxes.
- **Mock Exam**: A full-length, timed practice simulation of the Kankor test.
- **Classroom**: An educational group created by an instructor where students can view assigned materials, take tests, and participate in discussions.
- **Material**: Academic documents (PDFs, slides) attached to courses or lessons.
