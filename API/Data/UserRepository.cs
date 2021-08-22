using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class UserRepository : IUserRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        public UserRepository(DataContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
        }

        public async Task<MemberDto> GetMemberAsync(string username, bool isCurrentUser)
        {
            var query =  _context.Users
                .Where(x => x.UserName == username)
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
                .AsQueryable();
            
            if (isCurrentUser) query = query.IgnoreQueryFilters();

            return await query.FirstOrDefaultAsync();
        }

        public async Task<PagedList<MemberDto>> GetMembersAsync(UserParams userParams)
        {
            var currentUserId = userParams.CurrentUserId;
           // var query = _context.Users.FromSqlRaw("Select Users.*, (Select Count(*) from Likes where Likes.SourceUserId = {0}) AS Liked, (Select {0}) as CurrentUserId FROM Users",currentUserId).AsQueryable();
            var query = _context.Users.Include(u => u.LikedByUsers).AsQueryable();

            query = query.Where(u => u.UserName != userParams.CurrentUsername);
            query = query.Where(u => u.Gender == userParams.Gender);

            var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);
            var maxDob = DateTime.Today.AddYears(-userParams.MinAge);

            query = query.Where(u => u.DateOfBirth >= minDob && u.DateOfBirth <= maxDob);

            

            query = userParams.OrderBy switch
            {
                "created" => query.OrderByDescending(u => u.Created),
                _ => query.OrderByDescending(u => u.LastActive)
            };

            var mapping = query.Select(user => new MemberDto
            {
                Id = user.Id,
                Username = user.UserName,
                PhotoUrl = user.Photos.FirstOrDefault(p => p.IsMain).Url,
                Age = user.DateOfBirth.CalculateAge(),
                KnownAs = user.KnownAs,
                Created = user.Created,
                LastActive = user.LastActive,
                Gender = user.Gender,
                Introduction = user.Introduction,
                LookingFor = user.LookingFor,
                Interests = user.Interests,
                City = user.City,
                Country = user.Country,
                Photos = (ICollection<PhotoDto>)user.Photos.Select(photo => new PhotoDto { Id = photo.Id, Url = photo.Url, IsMain = photo.IsMain}),
                Liked = user.LikedByUsers.Where(l => l.SourceUserId == currentUserId).Count()

            });

            return await PagedList<MemberDto>.CreateAsync(mapping.AsNoTracking(), userParams.PageNumber, userParams.PageSize);
        }

        public async Task<AppUser> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<AppUser> GetUserByPhotoId(int photoId)
        {
            return await _context.Users.Include(p => p.Photos).IgnoreQueryFilters().Where(p => p.Photos.Any(p => p.Id == photoId)).FirstOrDefaultAsync();
        }

        public async Task<AppUser> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .Include(p => p.Photos)
                .SingleOrDefaultAsync(x => x.UserName == username);
        }

        public async Task<string> GetUserGender(string username)
        {
            return await _context.Users.Where(x => x.UserName == username).Select(x => x.Gender).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<AppUser>> GetUsersAsync()
        {
            return await _context.Users
                .Include(p => p.Photos)
                .ToListAsync();
        }

        public void Update(AppUser user)
        {
            _context.Entry(user).State = EntityState.Modified;
        }
    }
}