import type { CodeAnnotation } from '../types/walkthrough';
import { catalogWalkthroughs } from './catalog.generated';

/** Annotated walkthroughs keyed by "category/slug", from each folder's optional walkthrough.ts. */
export const walkthroughs: Record<string, CodeAnnotation[]> = catalogWalkthroughs;

export const getWalkthrough = (category: string, slug: string): CodeAnnotation[] => walkthroughs[`${category}/${slug}`] ?? [];
