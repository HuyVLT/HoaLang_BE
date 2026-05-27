import { User } from '../models/User.model';

declare global {
  namespace Express {
    interface User extends InstanceType<typeof User> {}
    
    interface Request {
      user?: User;
    }
  }
}
