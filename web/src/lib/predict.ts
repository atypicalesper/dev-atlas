export interface PredictBlock {
  title: string;
  prompt: string;
  code: string;
  answer: string;
  explanation: string;
}

const PREDICT_BLOCKS: Record<string, PredictBlock[]> = {
  'javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop': [
    {
      title: 'Microtasks vs Macrotasks',
      prompt: 'What prints, and in what order?',
      code: `console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');`,
      answer: `A
D
C
B`,
      explanation: 'Synchronous logs run first, then the microtask queue drains (`C`), and only then does the timer macrotask run (`B`).',
    },
  ],
  'javascript/01-javascript-fundamentals/03-prototypes-and-inheritance/01-prototype-chain': [
    {
      title: 'Prototype Lookup',
      prompt: 'What does this log?',
      code: `const animal = { sound: 'growl' };
const dog = Object.create(animal);
dog.sound = 'woof';
delete dog.sound;

console.log(dog.sound);`,
      answer: 'growl',
      explanation: 'After deleting the own property, lookup falls back to the prototype chain and finds `sound` on `animal`.',
    },
  ],
  'python/01-python-essentials/01-python-for-js-devs': [
    {
      title: 'Comprehension Shape',
      prompt: 'What list is produced?',
      code: `nums = [1, 2, 3, 4, 5]
result = [n * 2 for n in nums if n % 2 == 1]
print(result)`,
      answer: '[2, 6, 10]',
      explanation: 'The comprehension filters to odd values first (`1, 3, 5`) and doubles each surviving item.',
    },
  ],
};

export function getPredictBlocks(slug: string[]): PredictBlock[] {
  return PREDICT_BLOCKS[slug.join('/')] ?? [];
}
