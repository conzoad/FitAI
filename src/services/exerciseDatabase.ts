import { Exercise, MuscleGroup } from '../models/types';

export const EXERCISES: Exercise[] = [
  // === Грудь ===
  {
    id: 'bench-press',
    name: 'Жим лёжа',
    muscleGroup: 'chest',
    equipment: 'Штанга',
    description: 'Базовое упражнение для грудных мышц. Лёжа на скамье, опустите штангу к груди и выжмите вверх.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
  },
  {
    id: 'dumbbell-press',
    name: 'Жим гантелей лёжа',
    muscleGroup: 'chest',
    equipment: 'Гантели',
    description: 'Жим гантелей на горизонтальной скамье. Позволяет увеличить амплитуду движения.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Press.gif',
  },
  {
    id: 'dumbbell-fly',
    name: 'Разводка гантелей',
    muscleGroup: 'chest',
    equipment: 'Гантели',
    description: 'Изолирующее упражнение. Разведите руки в стороны, слегка сгибая локти.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Fly.gif',
  },
  {
    id: 'push-ups',
    name: 'Отжимания',
    muscleGroup: 'chest',
    equipment: 'Собственный вес',
    description: 'Классическое упражнение. Опуститесь до касания грудью пола и отожмитесь.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif',
  },

  // === Спина ===
  {
    id: 'pull-ups',
    name: 'Подтягивания',
    muscleGroup: 'back',
    equipment: 'Турник',
    description: 'Базовое упражнение для широчайших мышц. Подтянитесь до подбородка выше перекладины.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-Up.gif',
  },
  {
    id: 'barbell-row',
    name: 'Тяга штанги в наклоне',
    muscleGroup: 'back',
    equipment: 'Штанга',
    description: 'Наклонитесь вперёд и тяните штангу к поясу. Держите спину прямой.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif',
  },
  {
    id: 'lat-pulldown',
    name: 'Тяга верхнего блока',
    muscleGroup: 'back',
    equipment: 'Тренажёр',
    description: 'Тяните рукоять блока к груди, сводя лопатки.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
  },
  {
    id: 'dumbbell-row',
    name: 'Тяга гантели в наклоне',
    muscleGroup: 'back',
    equipment: 'Гантель',
    description: 'Одной рукой тяните гантель к поясу, опираясь другой рукой на скамью.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif',
  },

  // === Плечи ===
  {
    id: 'overhead-press',
    name: 'Жим стоя',
    muscleGroup: 'shoulders',
    equipment: 'Штанга',
    description: 'Выжмите штангу над головой из положения на уровне плеч.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Overhead-Press.gif',
  },
  {
    id: 'lateral-raise',
    name: 'Махи в стороны',
    muscleGroup: 'shoulders',
    equipment: 'Гантели',
    description: 'Поднимите гантели в стороны до уровня плеч. Изолирует средний пучок дельт.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif',
  },
  {
    id: 'upright-row',
    name: 'Тяга к подбородку',
    muscleGroup: 'shoulders',
    equipment: 'Штанга',
    description: 'Тяните штангу вдоль тела вверх, разводя локти в стороны.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Upright-Row.gif',
  },

  // === Бицепс ===
  {
    id: 'barbell-curl',
    name: 'Подъём штанги на бицепс',
    muscleGroup: 'biceps',
    equipment: 'Штанга',
    description: 'Стоя, согните руки со штангой. Локти прижаты к корпусу.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif',
  },
  {
    id: 'hammer-curl',
    name: 'Молотковые сгибания',
    muscleGroup: 'biceps',
    equipment: 'Гантели',
    description: 'Сгибания рук с нейтральным хватом. Развивает плечелучевую мышцу.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif',
  },
  {
    id: 'concentration-curl',
    name: 'Концентрированные сгибания',
    muscleGroup: 'biceps',
    equipment: 'Гантель',
    description: 'Сидя, уприте локоть во внутреннюю часть бедра и согните руку.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Concentration-Curl.gif',
  },

  // === Трицепс ===
  {
    id: 'skull-crusher',
    name: 'Французский жим',
    muscleGroup: 'triceps',
    equipment: 'Штанга',
    description: 'Лёжа на скамье, опустите штангу ко лбу, сгибая только локти.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Skull-Crusher.gif',
  },
  {
    id: 'tricep-pushdown',
    name: 'Разгибания на блоке',
    muscleGroup: 'triceps',
    equipment: 'Тренажёр',
    description: 'Разгибайте руки на верхнем блоке, прижимая локти к корпусу.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif',
  },
  {
    id: 'dips',
    name: 'Отжимания на брусьях',
    muscleGroup: 'triceps',
    equipment: 'Брусья',
    description: 'Опуститесь между брусьями и отожмитесь. Наклон вперёд — акцент на грудь, вертикально — на трицепс.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Chest-Dip.gif',
  },

  // === Ноги ===
  {
    id: 'squat',
    name: 'Приседания со штангой',
    muscleGroup: 'legs',
    equipment: 'Штанга',
    description: 'Базовое упражнение. Присядьте до параллели бёдер с полом.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Squat.gif',
  },
  {
    id: 'leg-press',
    name: 'Жим ногами',
    muscleGroup: 'legs',
    equipment: 'Тренажёр',
    description: 'Выжимайте платформу ногами. Безопасная альтернатива приседаниям.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif',
  },
  {
    id: 'lunges',
    name: 'Выпады',
    muscleGroup: 'legs',
    equipment: 'Гантели',
    description: 'Шагните вперёд и опуститесь до прямого угла в коленях.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunges.gif',
  },
  {
    id: 'leg-extension',
    name: 'Разгибания ног',
    muscleGroup: 'legs',
    equipment: 'Тренажёр',
    description: 'Изолированная работа квадрицепса. Разгибайте ноги в тренажёре.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
  },

  // === Ягодицы ===
  {
    id: 'hip-thrust',
    name: 'Ягодичный мост',
    muscleGroup: 'glutes',
    equipment: 'Штанга',
    description: 'Упритесь спиной в скамью и поднимите таз со штангой на бёдрах.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif',
  },
  {
    id: 'romanian-deadlift',
    name: 'Румынская тяга',
    muscleGroup: 'glutes',
    equipment: 'Штанга',
    description: 'Наклонитесь вперёд с почти прямыми ногами, растягивая заднюю поверхность бедра.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Romanian-Deadlift.gif',
  },

  // === Пресс ===
  {
    id: 'crunches',
    name: 'Скручивания',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Лёжа на спине, поднимите плечи от пола, сокращая мышцы пресса.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Crunch.gif',
  },
  {
    id: 'plank',
    name: 'Планка',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Статическое упражнение. Удерживайте тело в прямой линии на предплечьях.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Front-Plank.gif',
  },
  {
    id: 'leg-raise',
    name: 'Подъём ног',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Лёжа на спине или в висе, поднимите прямые ноги вверх.',
    isCompound: false,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Raise.gif',
  },

  // === Кардио ===
  {
    id: 'running',
    name: 'Бег',
    muscleGroup: 'cardio',
    equipment: 'Беговая дорожка',
    description: 'Кардио-тренировка. Укажите дистанцию или время в заметках.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Run.gif',
  },
  {
    id: 'cycling',
    name: 'Велотренажёр',
    muscleGroup: 'cardio',
    equipment: 'Велотренажёр',
    description: 'Кардио на велотренажёре. Укажите время и сопротивление в заметках.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Stationary-Bike.gif',
  },

  // === Всё тело ===
  {
    id: 'burpees',
    name: 'Бёрпи',
    muscleGroup: 'fullBody',
    equipment: 'Собственный вес',
    description: 'Присядьте, прыгните в упор лёжа, отожмитесь, вернитесь и подпрыгните.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Burpee.gif',
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    muscleGroup: 'fullBody',
    equipment: 'Штанга',
    description: 'Базовое упражнение. Поднимите штангу с пола, разгибая ноги и спину.',
    isCompound: true,
    gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif',
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getExercisesByGroup(group: MuscleGroup): Exercise[] {
  return EXERCISES.filter((e) => e.muscleGroup === group);
}

export function getAllMuscleGroups(): MuscleGroup[] {
  return ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio', 'fullBody'];
}
