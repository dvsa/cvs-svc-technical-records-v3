describe('get function', () => {
  describe('happy path', () => {
    it('should find a record', async () => {
      const response = await fetch('http:/127.0.0.1:3000/v3/technical-records/XYZEP5JYOMM00020/2019-06-15T10:26:53.903Z');
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });
  });

  describe('unhappy path', () => {
    it('should return not found', async () => {
      const response = await fetch('http:/127.0.0.1:3000/v3/technical-records/XYZEP5JYOMM00020/bar');
      expect(response.status).toBe(400);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await response.json();
      expect(json).toEqual({ errors: ['Invalid created timestamp'] });
    });
  });
});
