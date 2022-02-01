export const AudioType = {
  Stereo: 'Stereo' as const,
  Positional: 'Positional' as const
}

export type AudioTypeType = keyof typeof AudioType

export const DistanceModel = {
  Linear: 'linear' as const,
  Inverse: 'inverse' as const,
  Exponential: 'exponential' as const
}

export const DistanceModelOptions = [
  { label: 'Linear', value: DistanceModel.Linear },
  { label: 'Inverse', value: DistanceModel.Inverse },
  { label: 'Exponential', value: DistanceModel.Exponential }
]
