import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { uploadPropertyImages } from '../../middleware/upload.js';
import { validate, createPropertySchema, updatePropertySchema, } from './properties.validators.js';
import { validateQuery, searchQuerySchema } from './properties.validators.js';
import { similar,searchlist } from './properties.controller.js';


import { create, list, getBySlug, update, remove } from './properties.controller.js';

const router = Router();

// router.get('/', list);
router.get('/:slug', getBySlug);

router.post(
    '/',
    authenticate,
    uploadPropertyImages,
    validate(createPropertySchema),
    create
);

router.patch(
    '/:id',
    authenticate,
    validate(updatePropertySchema),
    update
);

router.delete('/:id', authenticate, remove);

router.get('/', validateQuery(searchQuerySchema), searchlist);

router.get('/:id/similar', similar);

export default router;