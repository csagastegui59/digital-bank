import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ message, error: 'BusinessError' }, status);
  }
}

export class UserAlreadyExistsException extends BusinessException {
  constructor() {
    super('User with this email already exists', HttpStatus.CONFLICT);
  }
}

export class UserNotFoundException extends BusinessException {
  constructor() {
    super('User not found', HttpStatus.NOT_FOUND);
  }
}

export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }
}

export class InsufficientFundsException extends BusinessException {
  constructor() {
    super('Insufficient funds for this transaction', HttpStatus.BAD_REQUEST);
  }
}

export class AccountNotFoundException extends BusinessException {
  constructor() {
    super('Account not found', HttpStatus.NOT_FOUND);
  }
}

export class AccountAlreadyExistsException extends BusinessException {
  constructor(message = 'Account already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvalidOperationException extends BusinessException {
  constructor(message = 'Invalid operation') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class TransactionNotFoundException extends BusinessException {
  constructor() {
    super('Transaction not found', HttpStatus.NOT_FOUND);
  }
}
