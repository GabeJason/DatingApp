namespace API.DTOs
{
    public class UpdatePasswordDto
    {
        public int UserId { get; set; }
        public string Password { get; set; }
        public string CurrentPassword { get; set; }
    }
}