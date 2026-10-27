export interface ReadingItem { id: string; title: string; category: string; body: string[]; }

export const readingItems: readonly ReadingItem[] = [
  { id: 'margin', title: 'Leave one margin open', category: 'Making', body: [
    'Put a small drawing on a large sheet of paper. Before adding anything else, turn the page around. The empty area changes what you notice about the mark you already made.',
    'A margin is useful space. It gives your eye somewhere to stop and gives the next decision somewhere to go. Filling it can be satisfying, but it is worth knowing why you are filling it.',
    'For a simple exercise, make three arrangements with the same two shapes. Keep the shapes unchanged and move only the space between them. The differences are often larger than expected.',
  ] },
  { id: 'walk', title: 'A familiar street, slowly', category: 'Attention', body: [
    'Imagine a shop window on a familiar street. Stop for a moment and notice the spacing between a few ordinary objects. The window can be unchanged while your attention reveals something new.',
    'This note is a small invitation to look at an everyday arrangement. A doorway, a row of books or the edge of a pavement can offer enough detail for a sketch.',
    'You do not need to collect everything. Choose one thing, describe it in plain words and leave the rest for another day.',
  ] },
  { id: 'draft', title: 'Keep the useful draft', category: 'Process', body: [
    'A rough version can answer a question that a finished version hides. It shows which part of an arrangement mattered before the details became convincing.',
    'Give a draft a clear name before changing it. Write down the question it helped answer and the one thing you would try next. A short note is easier to use than a folder full of unnamed alternatives.',
    'When you return, compare the versions using the same content. Ask what became easier to read or do. Keep the decision that the comparison supports, even when the earlier version is your favourite.',
  ] },
  { id: 'table', title: 'The objects on the table', category: 'Everyday', body: [
    'A cup, a notebook and a folded piece of paper make a modest still life. Move the cup closer to the notebook and the objects begin to feel like a group. Move it away and each has more independence.',
    'The objects have not changed, but their relationship has. This is a useful way to think about a screen before choosing colours or adding detail.',
    'Arrange a few ordinary things and notice where you look first. Then make one deliberate change. The exercise ends when you can explain the difference without calling one arrangement better by default.',
  ] },
];

export const readingById = new Map(readingItems.map(item => [item.id, item]));
