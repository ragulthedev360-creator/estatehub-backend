 


import slugify from 'slugify';
import crypto from 'crypto';
import { pool } from '../../config/db.js';

class PropertyError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

function buildSlug(title) {
    const base = slugify(title, {
        lower: true,
        strict: true,
    });

    const suffix = crypto.randomBytes(3).toString('hex');

    return `${base}-${suffix}`;
}


 

export async function createProperty(ownerId, data, files = []) {
    const slug = buildSlug(data.title);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO properties
        (
          owner_id,
          title,
          description,
          property_type,
          listing_type,
          price,
          bedrooms,
          bathrooms,
          area_sqft,
          city,
          locality,
          address,
          slug
        )
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
            [
                ownerId,
                data.title,
                data.description || null,
                data.propertyType,
                data.listingType,
                data.price,
                data.bedrooms ?? null,
                data.bathrooms ?? null,
                data.areaSqft ?? null,
                data.city,
                data.locality || null,
                data.address || null,
                slug,
            ]
        );

        const property = result.rows[0];

        // Insert images
        if (files.length > 0) {
            for (let idx = 0; idx < files.length; idx++) {
                const file = files[idx];

                await client.query(
                    `INSERT INTO property_images
            (
              property_id,
              url,
              is_primary,
              display_order
            )
           VALUES ($1, $2, $3, $4)`,
                    [
                        property.id,
                        `/uploads/properties/${file.filename}`,
                        idx === 0,
                        idx,
                    ]
                );
            }
        }

        await client.query('COMMIT');

        return getPropertyById(property.id);

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;

    } finally {
        client.release();
    }
}

export async function searchProperties({ cursor, limit = 20, city, locality, propertyType, listingType,
    minPrice, maxPrice, bedrooms, q, sort = 'newest', } = {}) {
        console.log('searchProperties====',cursor, limit = 20, city, locality, propertyType, listingType,
    minPrice, maxPrice, bedrooms, q, sort);
        
    const conditions = [`p.status = 'active'`];
    const params = [];
    let index = 1;

    if (city) {
        conditions.push(`p.city ILIKE $${index}`);
        params.push(`%${city}%`);
        index++;
    }

    if (locality) {
        conditions.push(`p.locality ILIKE $${index}`);
        params.push(`%${locality}%`);
        index++;
    }

    if (propertyType) {
        conditions.push(`p.property_type = $${index}`);
        params.push(propertyType);
        index++;
    }

    if (listingType) {
        conditions.push(`p.listing_type = $${index}`);
        params.push(listingType);
        index++;
    }

    if (minPrice !== undefined) {
        conditions.push(`p.price >= $${index}`);
        params.push(minPrice);
        index++;
    }

    if (maxPrice !== undefined) {
        conditions.push(`p.price <= $${index}`);
        params.push(maxPrice);
        index++;
    }

    if (bedrooms !== undefined) {
        conditions.push(`p.bedrooms = $${index}`);
        params.push(bedrooms);
        index++;
    }

    if (q) {
        conditions.push(`p.search_vector @@ plainto_tsquery('english', $${index})`);
        params.push(q);
        index++;
    }

    // Sort + cursor column must match, or keyset pagination breaks silently
    let orderBy;
    let cursorColumn;

    if (sort === 'price_asc') {
        orderBy = 'p.price ASC, p.id ASC';
        cursorColumn = 'price';
    } else if (sort === 'price_desc') {
        orderBy = 'p.price DESC, p.id DESC';
        cursorColumn = 'price';
    } else {
        orderBy = 'p.created_at DESC, p.id DESC';
        cursorColumn = 'created_at';
    }

    if (cursor) {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        const comparator = sort === 'price_asc' ? '>' : '<';
        conditions.push(`(p.${cursorColumn}, p.id) ${comparator} ($${index}, $${index + 1})`);
        params.push(decoded.value, decoded.id);
        index += 2;
    }

    const safeLimit = Math.min(Number(limit) || 20, 100);
    params.push(safeLimit + 1);

    const result = await pool.query(
        `
    SELECT p.*,
      (SELECT pi.url FROM property_images pi
       WHERE pi.property_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image
    FROM properties p
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${index}
    `,
        params
    );

    const hasMore = result.rows.length > safeLimit;
    const rows = hasMore ? result.rows.slice(0, safeLimit) : result.rows;

    let nextCursor = null;
    if (hasMore && rows.length > 0) {
        nextCursor = Buffer.from(
            JSON.stringify({
                value: rows[rows.length - 1][cursorColumn],
                id: rows[rows.length - 1].id,
            })
        ).toString('base64');
    }

    return { data: rows, pageInfo: { nextCursor, hasMore } };
}
 

export async function getPropertyById(id) {

    const result = await pool.query(
        `
    SELECT
      p.*,

      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.url,
            'isPrimary', pi.is_primary
          )
          ORDER BY pi.display_order
        )
        FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS images

    FROM properties p

    LEFT JOIN property_images pi
      ON pi.property_id = p.id

    WHERE p.id = $1

    GROUP BY p.id
    `,
        [id]
    );

    const property = result.rows[0];

    if (!property) {
        throw new PropertyError(
            'Property not found',
            404
        );
    }

    return property;
}



export async function updateProperty(
    propertyId,
    ownerId,
    data
) {

    const existing =
        await assertOwnership(
            propertyId,
            ownerId
        );

    const fields = [];
    const values = [];

    let index = 1;

    const fieldMap = {
        title: 'title',
        description: 'description',
        propertyType: 'property_type',
        listingType: 'listing_type',
        price: 'price',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        areaSqft: 'area_sqft',
        city: 'city',
        locality: 'locality',
        address: 'address',
    };

    for (
        const [key, column]
        of Object.entries(fieldMap)
    ) {

        if (data[key] !== undefined) {

            fields.push(
                `${column} = $${index}`
            );

            values.push(data[key]);

            index++;
        }
    }

    if (fields.length === 0) {
        return existing;
    }

    fields.push(
        `updated_at = now()`
    );

    values.push(propertyId);

    await pool.query(
        `
    UPDATE properties
    SET ${fields.join(', ')}
    WHERE id = $${index}
    `,
        values
    );

    return getPropertyById(propertyId);
}



export async function deleteProperty(
    propertyId,
    ownerId
) {

    await assertOwnership(
        propertyId,
        ownerId
    );

    await pool.query(
        `DELETE FROM properties WHERE id = $1`,
        [propertyId]
    );
}

async function assertOwnership(
    propertyId,
    userId
) {

    const result = await pool.query(
        `SELECT * FROM properties WHERE id = $1`,
        [propertyId]
    );

    const property = result.rows[0];

    if (!property) {
        throw new PropertyError(
            'Property not found',
            404
        );
    }

    if (property.owner_id !== userId) {
        throw new PropertyError(
            'You do not have permission to modify this listing',
            403
        );
    }

    return property;
}


export async function listProperties({ cursor, limit = 20 }) {
    const params = [];
    let cursorClause = '';

    if (cursor) {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        params.push(decoded.createdAt, decoded.id);
        cursorClause = `WHERE (created_at, id) < ($${params.length - 1}, $${params.length})`;
    }

    params.push(limit + 1);

    const result = await pool.query(
        `SELECT p.*,
       (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image
     FROM properties p
     ${cursorClause}
     WHERE p.status = 'active' ${cursor ? '' : ''}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
        params
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

    const nextCursor = hasMore
        ? Buffer.from(
            JSON.stringify({
                createdAt: rows[rows.length - 1].created_at,
                id: rows[rows.length - 1].id,
            })
        ).toString('base64')
        : null;

    return { data: rows, pageInfo: { nextCursor, hasMore } };
}

export async function getPropertyBySlug(slug) {
    const result = await pool.query(
        `SELECT p.*,
       COALESCE(
         json_agg(
           json_build_object('id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary)
           ORDER BY pi.display_order
         ) FILTER (WHERE pi.id IS NOT NULL), '[]'
       ) AS images
     FROM properties p
     LEFT JOIN property_images pi ON pi.property_id = p.id
     WHERE p.slug = $1
     GROUP BY p.id`,
        [slug]
    );

    const property = result.rows[0];
    if (!property) {
        throw new PropertyError('Property not found', 404);
    }
    return property;
}

export async function getSimilarProperties(propertyId) {
    const current = await pool.query(
        `SELECT city, property_type, price, bedrooms FROM properties WHERE id = $1`,
        [propertyId]
    );

    const base = current.rows[0];
    if (!base) return [];

    const result = await pool.query(
        `SELECT p.*,
       (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image
     FROM properties p
     WHERE p.city = $1
       AND p.property_type = $2
       AND p.id != $3
       AND p.status = 'active'
       AND p.price BETWEEN $4 * 0.8 AND $4 * 1.2
     ORDER BY
       (p.bedrooms = $5)::int DESC,
       ABS(p.price - $4) ASC
     LIMIT 6`,
        [base.city, base.property_type, propertyId, base.price, base.bedrooms]
    );

    return result.rows;
}


export { PropertyError };