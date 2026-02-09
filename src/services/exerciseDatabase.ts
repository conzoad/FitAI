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
  },
  {
    id: 'dumbbell-press',
    name: 'Жим гантелей лёжа',
    muscleGroup: 'chest',
    equipment: 'Гантели',
    description: 'Жим гантелей на горизонтальной скамье. Позволяет увеличить амплитуду движения.',
    isCompound: true,
  },
  {
    id: 'dumbbell-fly',
    name: 'Разводка гантелей',
    muscleGroup: 'chest',
    equipment: 'Гантели',
    description: 'Изолирующее упражнение. Разведите руки в стороны, слегка сгибая локти.',
    isCompound: false,
  },
  {
    id: 'push-ups',
    name: 'Отжимания',
    muscleGroup: 'chest',
    equipment: 'Собственный вес',
    description: 'Классическое упражнение. Опуститесь до касания грудью пола и отожмитесь.',
    isCompound: true,
  },

  // === Спина ===
  {
    id: 'pull-ups',
    name: 'Подтягивания',
    muscleGroup: 'back',
    equipment: 'Турник',
    description: 'Базовое упражнение для широчайших мышц. Подтянитесь до подбородка выше перекладины.',
    isCompound: true,
  },
  {
    id: 'barbell-row',
    name: 'Тяга штанги в наклоне',
    muscleGroup: 'back',
    equipment: 'Штанга',
    description: 'Наклонитесь вперёд и тяните штангу к поясу. Держите спину прямой.',
    isCompound: true,
  },
  {
    id: 'lat-pulldown',
    name: 'Тяга верхнего блока',
    muscleGroup: 'back',
    equipment: 'Тренажёр',
    description: 'Тяните рукоять блока к груди, сводя лопатки.',
    isCompound: true,
  },
  {
    id: 'dumbbell-row',
    name: 'Тяга гантели в наклоне',
    muscleGroup: 'back',
    equipment: 'Гантель',
    description: 'Одной рукой тяните гантель к поясу, опираясь другой рукой на скамью.',
    isCompound: true,
  },

  // === Плечи ===
  {
    id: 'overhead-press',
    name: 'Жим стоя',
    muscleGroup: 'shoulders',
    equipment: 'Штанга',
    description: 'Выжмите штангу над головой из положения на уровне плеч.',
    isCompound: true,
  },
  {
    id: 'lateral-raise',
    name: 'Махи в стороны',
    muscleGroup: 'shoulders',
    equipment: 'Гантели',
    description: 'Поднимите гантели в стороны до уровня плеч. Изолирует средний пучок дельт.',
    isCompound: false,
  },
  {
    id: 'upright-row',
    name: 'Тяга к подбородку',
    muscleGroup: 'shoulders',
    equipment: 'Штанга',
    description: 'Тяните штангу вдоль тела вверх, разводя локти в стороны.',
    isCompound: true,
  },

  // === Бицепс ===
  {
    id: 'barbell-curl',
    name: 'Подъём штанги на бицепс',
    muscleGroup: 'biceps',
    equipment: 'Штанга',
    description: 'Стоя, согните руки со штангой. Локти прижаты к корпусу.',
    isCompound: false,
  },
  {
    id: 'hammer-curl',
    name: 'Молотковые сгибания',
    muscleGroup: 'biceps',
    equipment: 'Гантели',
    description: 'Сгибания рук с нейтральным хватом. Развивает плечелучевую мышцу.',
    isCompound: false,
  },
  {
    id: 'concentration-curl',
    name: 'Концентрированные сгибания',
    muscleGroup: 'biceps',
    equipment: 'Гантель',
    description: 'Сидя, уприте локоть во внутреннюю часть бедра и согните руку.',
    isCompound: false,
  },

  // === Трицепс ===
  {
    id: 'skull-crusher',
    name: 'Французский жим',
    muscleGroup: 'triceps',
    equipment: 'Штанга',
    description: 'Лёжа на скамье, опустите штангу ко лбу, сгибая только локти.',
    isCompound: false,
  },
  {
    id: 'tricep-pushdown',
    name: 'Разгибания на блоке',
    muscleGroup: 'triceps',
    equipment: 'Тренажёр',
    description: 'Разгибайте руки на верхнем блоке, прижимая локти к корпусу.',
    isCompound: false,
  },
  {
    id: 'dips',
    name: 'Отжимания на брусьях',
    muscleGroup: 'triceps',
    equipment: 'Брусья',
    description: 'Опуститесь между брусьями и отожмитесь. Наклон вперёд — акцент на грудь, вертикально — на трицепс.',
    isCompound: true,
  },

  // === Ноги ===
  {
    id: 'squat',
    name: 'Приседания со штангой',
    muscleGroup: 'legs',
    equipment: 'Штанга',
    description: 'Базовое упражнение. Присядьте до параллели бёдер с полом.',
    isCompound: true,
  },
  {
    id: 'leg-press',
    name: 'Жим ногами',
    muscleGroup: 'legs',
    equipment: 'Тренажёр',
    description: 'Выжимайте платформу ногами. Безопасная альтернатива приседаниям.',
    isCompound: true,
  },
  {
    id: 'lunges',
    name: 'Выпады',
    muscleGroup: 'legs',
    equipment: 'Гантели',
    description: 'Шагните вперёд и опуститесь до прямого угла в коленях.',
    isCompound: true,
  },
  {
    id: 'leg-extension',
    name: 'Разгибания ног',
    muscleGroup: 'legs',
    equipment: 'Тренажёр',
    description: 'Изолированная работа квадрицепса. Разгибайте ноги в тренажёре.',
    isCompound: false,
  },

  // === Ягодицы ===
  {
    id: 'hip-thrust',
    name: 'Ягодичный мост',
    muscleGroup: 'glutes',
    equipment: 'Штанга',
    description: 'Упритесь спиной в скамью и поднимите таз со штангой на бёдрах.',
    isCompound: true,
  },
  {
    id: 'romanian-deadlift',
    name: 'Румынская тяга',
    muscleGroup: 'glutes',
    equipment: 'Штанга',
    description: 'Наклонитесь вперёд с почти прямыми ногами, растягивая заднюю поверхность бедра.',
    isCompound: true,
  },

  // === Пресс ===
  {
    id: 'crunches',
    name: 'Скручивания',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Лёжа на спине, поднимите плечи от пола, сокращая мышцы пресса.',
    isCompound: false,
  },
  {
    id: 'plank',
    name: 'Планка',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Статическое упражнение. Удерживайте тело в прямой линии на предплечьях.',
    isCompound: false,
  },
  {
    id: 'leg-raise',
    name: 'Подъём ног',
    muscleGroup: 'abs',
    equipment: 'Собственный вес',
    description: 'Лёжа на спине или в висе, поднимите прямые ноги вверх.',
    isCompound: false,
  },

  // === Кардио ===
  {
    id: 'running',
    name: 'Бег',
    muscleGroup: 'cardio',
    equipment: 'Беговая дорожка',
    description: 'Кардио-тренировка. Укажите дистанцию или время в заметках.',
    isCompound: true,
  },
  {
    id: 'cycling',
    name: 'Велотренажёр',
    muscleGroup: 'cardio',
    equipment: 'Велотренажёр',
    description: 'Кардио на велотренажёре. Укажите время и сопротивление в заметках.',
    isCompound: true,
  },

  // === Всё тело ===
  {
    id: 'burpees',
    name: 'Бёрпи',
    muscleGroup: 'fullBody',
    equipment: 'Собственный вес',
    description: 'Присядьте, прыгните в упор лёжа, отожмитесь, вернитесь и подпрыгните.',
    isCompound: true,
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    muscleGroup: 'fullBody',
    equipment: 'Штанга',
    description: 'Базовое упражнение. Поднимите штангу с пола, разгибая ноги и спину.',
    isCompound: true,
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
