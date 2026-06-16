export function handleApiError(error) {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict. This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `An unexpected error occurred (${error.response.status}).`;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection and try again.';
  } else {
    // Error setting up the request
    return error.message || 'An error occurred. Please try again.';
  }
}

export function getFieldError(error, fieldName) {
  if (error?.response?.data?.errors) {
    return error.response.data.errors[fieldName];
  }
  return null;
}
