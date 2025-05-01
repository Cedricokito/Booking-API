import prisma from '../prismaClient.js';

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {Function} getResourceUserId - Function to get resource owner's ID
 */
export const isResourceOwner = (getResourceUserId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            const resourceUserId = await getResourceUserId(req);

            if (!resourceUserId) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            if (req.user.role === 'ADMIN' || req.user.id === resourceUserId) {
                next();
            } else {
                res.status(403).json({ error: 'You do not have permission to modify this resource' });
            }
        } catch (error) {
            console.error('Error checking resource ownership:', error);
            res.status(500).json({ error: 'Error checking resource ownership' });
        }
    };
};

/**
 * Helper function to check property ownership
 */
export const getPropertyOwner = async (propertyId) => {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hostId: true }
    });
    return property?.hostId;
};

/**
 * Helper function to check booking ownership
 */
export const getBookingOwner = async (bookingId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true }
    });
    return booking?.userId;
}; 