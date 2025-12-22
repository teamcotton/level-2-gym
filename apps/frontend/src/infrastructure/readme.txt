External I/O (API, DB, etc.)

This layer handles all input/output interactions with the outside world — like HTTP requests,
database calls, or third-party APIs.
In our case, it’s mostly about setting up Axios and creating a simple API client for users.

The infrastructure layer should never contain business logic.
Instead, it should implement data access behaviors expected by the application layer.

// libs/users/infrastructure/axiosInstance.ts
//It could be to move to the shared api folder
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: '/api',
});
This Axios instance configures a base URL for the app to simplify API requests across the app.

// libs/users/infrastructure/userApi.ts
import { axiosInstance } from './axiosInstance';
import { User, NewUser } from '../../user/domain/user';

export const userApi = {
  async create(user: NewUser) {
    const res = await axiosInstance.post('/users', user);
    return res.data;
  },
  async getAll() {
    const res = await axiosInstance.get<User[]>('/users');
    return res.data;
  },
};
The repository layer abstracts API interactions. It provides create and getAll methods to interact with the user endpoint.

