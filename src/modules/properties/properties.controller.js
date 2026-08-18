import {
    createProperty,
    listProperties,
    getPropertyBySlug,
    updateProperty,
    deleteProperty,
    searchProperties,
    getSimilarProperties
} from './properties.service.js'; 


export async function create(req, res, next) {
    try {
        const property = await createProperty(
            req.user.id,
            req.validatedBody,
            req.files || []
        );
        res.status(201).json({ property });
    } catch (err) {
        next(err);
    }
}

export async function list(req, res, next) {
    try {
        const { cursor, limit } = req.query;
        const result = await listProperties({
            cursor,
            limit: limit ? Number(limit) : undefined,
        });
        console.log('listProperties',req, res, next)

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getBySlug(req, res, next) {
    try {
        console.log('req, res, next',req, res, next)
        const property = await getPropertyBySlug(req.params.slug);
        res.status(200).json({ property });
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        const property = await updateProperty(
            req.params.id,
            req.user.id,
            req.validatedBody
        );
        res.status(200).json({ property });
    } catch (err) {
        next(err);
    }
}

export async function remove(req, res, next) {
    try {
        await deleteProperty(req.params.id, req.user.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}


export async function searchlist(req, res, next) {
  try {
    const result = await searchProperties(req.validatedQuery); 
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}



export async function similar(req, res, next) {
  try {
    const properties = await getSimilarProperties(req.params.id);
    res.status(200).json({ data: properties });
  } catch (err) {
    next(err);
  }
}