import express from 'express';
import { createAmenity, getAmenity, updateAmenity, deleteAmenity, getAllAmenities } from '../controllers/amenityController.js';

const router = express.Router();

router.post('', createAmenity);

router.get('/:amenityId', getAmenity);

router.put('/:amenityId', updateAmenity);

router.delete('/:amenityId', deleteAmenity);

router.get("", getAllAmenities)

export default router;
