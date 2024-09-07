export async function splitAudio(file: File): Promise<{ vocals: string; accompaniment: string }> {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Sending file to backend:', file.name);

  try {
    const response = await fetch('http://127.0.0.1:5000/split', {
      method: 'POST',
      body: formData,
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || 'An error occurred while processing the file.');
    }

    const data = await response.json();
    console.log('Backend response data:', data);

    // Replace backslashes with forward slashes in the response data
    const vocalsPath = data.vocals.replace(/\\/g, '/');
    const accompanimentPath = data.accompaniment.replace(/\\/g, '/');

    // Construct the new paths using the provided format
    const baseUrl = 'http://127.0.0.1:5000/';
    const vocals = `${baseUrl}${vocalsPath}`;
    const accompaniment = `${baseUrl}${accompanimentPath}`;

    return {
      vocals,
      accompaniment,
    };
  } catch (error) {
    console.error('Error in splitAudio:', error);
    throw error;
  }
}