import app from '@/app';
import request from 'supertest';

describe('Product Routes', () => {
    it('should fetch all products', async () => {
        const response = await request(app).get('/products');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Get all products');
    });

    it('should create a new product', async () => {
        const response = await request(app).post('/products');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Create a new product');
    });

    it('should fetch a product by ID', async () => {
        const response = await request(app).get('/products/1');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Get product with ID: 1');
    });

    it('should update a product by ID', async () => {
        const response = await request(app).put('/products/1');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Update product with ID: 1');
    });

    it('should delete a product by ID', async () => {
        const response = await request(app).delete('/products/1');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Delete product with ID: 1');
    });
});