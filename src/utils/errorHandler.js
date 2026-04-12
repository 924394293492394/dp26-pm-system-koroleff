export const getErrorMessage = (error) => {
  if (!error.response) {
    return "Сервер недоступен";
  }

  const { status, data } = error.response;

  if (status === 400) {
    if (data.message === "Invalid credentials") {
      return "Неверный логин или пароль";
    }

    return data.message || "Ошибка запроса";
  }

  if (status === 401) {
    return "Не авторизован";
  }

  if (status === 500) {
    return "Ошибка сервера";
  }

  return "Неизвестная ошибка";
};