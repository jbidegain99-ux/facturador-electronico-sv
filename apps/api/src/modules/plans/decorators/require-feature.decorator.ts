import { SetMetadata } from '@nestjs/common';
import { FeatureCode } from '../../../common/plan-features';

export const FEATURE_REQUIRED_KEY = 'feature_required';

export const RequireFeature = (feature: FeatureCode) =>
  SetMetadata(FEATURE_REQUIRED_KEY, feature);
