export interface ApiInsight {
  id: number;
  brand: number;
  createdAt: string;
  text: string;
}

export interface CreateInsightData {
  brand: number;
  text: string;
}

export interface ApiError {
  error: string;
}

const API_BASE = "/api";

class ApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Request failed: ${response.statusText}`;

      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If parsing JSON fails, use the default error message
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async fetchInsights(): Promise<ApiInsight[]> {
    const response = await fetch(`${API_BASE}/insights`);
    return await this.handleResponse<ApiInsight[]>(response);
  }

  async createInsight(data: CreateInsightData): Promise<ApiInsight> {
    const response = await fetch(`${API_BASE}/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await this.handleResponse<ApiInsight>(response);
  }

  async deleteInsight(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/insights/${id}`, {
      method: "DELETE",
    });

    await this.handleResponse<{ message: string }>(response);
  }
}

export const api = new ApiService();
