import { createInquiry, listInquiriesForOwner } from './inquiries.service.js';

export async function create(req, res, next) {
  try {
    // Honeypot check — real users never fill this hidden field, bots often do
    if (req.validatedBody.website) {
      return res.status(400).json({ message: 'Spam detected' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const senderId = req.user?.id || null;

    const { website, ...inquiryData } = req.validatedBody;

    const inquiry = await createInquiry(req.params.id, inquiryData, ip, senderId);
    res.status(201).json({ inquiry });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req, res, next) {
  try {
    const inquiries = await listInquiriesForOwner(req.user.id);
    res.status(200).json({ data: inquiries });
  } catch (err) {
    next(err);
  }
}