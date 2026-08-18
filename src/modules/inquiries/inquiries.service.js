import { pool } from '../../config/db.js';

class InquiryError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function createInquiry(propertyId, data, ipAddress, senderId = null) {
  const propertyResult = await pool.query(
    'SELECT id, owner_id, status FROM properties WHERE id = $1',
    [propertyId]
  );
  const property = propertyResult.rows[0];

  if (!property) {
    throw new InquiryError('Property not found', 404);
  }
  if (property.status !== 'active') {
    throw new InquiryError('This property is no longer available', 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO inquiries (property_id, sender_id, name, email, phone, message, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, property_id, name, email, phone, message, created_at`,
      [propertyId, senderId, data.name, data.email, data.phone || null, data.message || null, ipAddress]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new InquiryError('You have already sent an inquiry for this property', 409);
    }
    throw err;
  }
}

export async function listInquiriesForOwner(ownerId) {
  const result = await pool.query(
    `SELECT i.id, i.name, i.email, i.phone, i.message, i.created_at,
            p.id AS property_id, p.title AS property_title, p.slug AS property_slug
     FROM inquiries i
     JOIN properties p ON p.id = i.property_id
     WHERE p.owner_id = $1
     ORDER BY i.created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

export { InquiryError };