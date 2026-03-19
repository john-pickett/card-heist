import { ImageSourcePropType } from 'react-native';

export type CrewMemberId = 'knuckles' | 'tico' | 'bishop' | 'deadlock' | 'fingers' | 'jinx';

export interface CrewMember {
  id: CrewMemberId;
  fullName: string;
  nickname: string;
  flavorText: string;
  bio: string;
  effect: string;
  summary: string;
  cost: number;
  imageSource: ImageSourcePropType;
}
