# Domain Layer Guide

## Overview

The domain layer contains pure business logic and validation functions that are separated from persistence concerns. This layer implements the core business rules of the application using pure functions that are easily testable and maintainable.

## Architecture

### Domain Structure

```
src/domain/
├── user/
│   ├── validation.ts          # User validation rules (pure functions)
│   └── business-rules.ts      # User business logic (pure functions)
├── authentication/
│   ├── validation.ts          # Authentication validation rules
│   └── business-rules.ts      # Authentication business logic
└── email-verification/
    ├── validation.ts          # Email verification validation
    └── business-rules.ts      # Email verification business logic
```

### Design Principles

1. **Pure Functions**: All domain functions are pure - they have no side effects and return the same output for the same input
2. **Separation of Concerns**: Business logic is completely separated from persistence and infrastructure concerns
3. **Testability**: Each function can be unit tested in isolation without mocking dependencies
4. **Reusability**: Domain functions can be reused across different services and contexts
5. **Type Safety**: All functions use strong TypeScript typing for inputs and outputs

## Domain Modules

### User Domain

**Validation Functions (`user/validation.ts`):**
- `validateUserDoesNotExist()` - Ensures email uniqueness
- `validateUserExists()` - Validates user existence
- `validateEmailUniqueForUpdate()` - Checks email conflicts during updates
- `validateEmailNotAlreadyVerified()` - Prevents duplicate verification
- `validateCreateUserData()` - Validates user creation input
- `validateUpdateUserData()` - Validates user update input

**Business Rules (`user/business-rules.ts`):**
- `shouldCreateUser()` - Determines if user creation should proceed
- `canUpdateEmail()` - Checks if email can be changed
- `prepareCreateUserData()` - Normalizes data for creation
- `prepareUpdateUserData()` - Normalizes data for updates
- `getUserAccessLevel()` - Determines user access level
- `isUserProfileComplete()` - Checks profile completeness

### Authentication Domain

**Validation Functions (`authentication/validation.ts`):**
- `validateUserCredentials()` - Validates login credentials
- `validatePasswordMatch()` - Checks password verification result
- `validateRefreshTokenPayload()` - Validates JWT refresh token structure
- `validatePasswordResetToken()` - Validates password reset token
- `validateUserCanResetPassword()` - Validates password reset eligibility

**Business Rules (`authentication/business-rules.ts`):**
- `canRegisterUser()` - Determines registration eligibility
- `canUserLogin()` - Checks login eligibility
- `canRefreshToken()` - Validates token refresh eligibility
- `shouldRevokeAccessToken()` - Determines if access token should be revoked
- `prepareLoginResponse()` - Formats login response data
- `isAuthenticationSuccessful()` - Validates overall authentication success

### Email Verification Domain

**Validation Functions (`email-verification/validation.ts`):**
- `validateVerificationTokenExists()` - Ensures verification token exists
- `validateUserExistsForVerification()` - Validates user for verification
- `validateEmailNotVerified()` - Prevents re-verification
- `validateVerificationTokenFormat()` - Validates token format

**Business Rules (`email-verification/business-rules.ts`):**
- `shouldSendVerificationEmail()` - Determines if verification email should be sent
- `canResendVerificationEmail()` - Checks resend eligibility
- `generateVerificationToken()` - Creates secure verification tokens
- `createVerificationLink()` - Builds verification URLs
- `shouldCompleteVerification()` - Determines if verification should complete

## Usage Patterns

### In Services

Services use domain functions to implement business logic:

```typescript
// Before (coupled with persistence)
async createUser(data: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("UserExists");
    return this.userRepo.create(data);
}

// After (using domain functions)
async createUser(data: CreateUserDto): Promise<User> {
    validateCreateUserData(data);
    const preparedData = prepareCreateUserData(data);
    const existing = await this.userRepo.findByEmail(preparedData.email);
    validateUserDoesNotExist(existing, preparedData.email);
    
    if (!shouldCreateUser(existing, preparedData)) {
        throw new Error("UserExists");
    }
    
    return this.userRepo.create(preparedData);
}
```

### Testing

Domain functions are easily unit tested:

```typescript
describe("User Domain Validation", () => {
    it("should validate user does not exist", () => {
        expect(() => {
            validateUserDoesNotExist(undefined, "test@example.com");
        }).not.toThrow();
    });
    
    it("should throw when user exists", () => {
        expect(() => {
            validateUserDoesNotExist(mockUser, "test@example.com");
        }).toThrow("UserExists");
    });
});
```

## Benefits

1. **Improved Testability**: Pure functions are easy to test without mocking
2. **Better Maintainability**: Business rules are centralized and clearly defined
3. **Enhanced Reusability**: Functions can be used across multiple services
4. **Clearer Separation**: Business logic is separate from infrastructure concerns
5. **Type Safety**: Strong typing prevents runtime errors
6. **Documentation**: Business rules serve as living documentation

## Best Practices

1. **Keep Functions Pure**: No side effects, no external dependencies
2. **Use Descriptive Names**: Function names should clearly describe their purpose
3. **Single Responsibility**: Each function should have one clear purpose
4. **Type Everything**: Use strict TypeScript typing for all inputs and outputs
5. **Test Thoroughly**: Achieve 100% test coverage for domain functions
6. **Document Business Rules**: Include clear JSDoc comments explaining business logic

## Related Documentation

- [Services Layer Guide](./services/services.guide.md)
- [Repository Layer Guide](./repositories/repositories.guide.md)
- [Testing Patterns](./testing/testing.guide.md)