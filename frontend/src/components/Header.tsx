import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../api/client';
import {
  Search,
  ChevronDown,
  LayoutGrid,
  Check,
  User,
} from 'lucide-react';

interface HeaderProps {
  profiles: UserProfile[];
  selectedProfileId: number;
  onSelectProfile: (id: number) => void;
  activeView: 'feed' | 'stories' | 'achievements' | 'admin';
  onChangeView: (view: 'feed' | 'stories' | 'achievements' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  activeView,
  onChangeView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    window.open(`https://www.avito.ru/all?q=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full bg-white text-[#222222] font-sans shadow-xs border-b border-[#e3e5e8] sticky top-0 z-40">
      {/* Main Header (Logo, All Categories, Search Bar, Admin Button, User Profile) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Authentic Avito Brand & Logo */}
        <div
          onClick={() => onChangeView('feed')}
          className="flex items-center shrink-0 cursor-pointer select-none"
        >
          <img src="/logo.svg" alt="Авито" className="h-[30px] w-auto" />
        </div>

        {/* All Categories Button */}
        <button className="hidden sm:flex items-center gap-2 bg-[#00a0ff] hover:bg-[#0088d6] text-white font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer">
          <LayoutGrid className="w-4 h-4" />
          <span>Все категории</span>
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl flex items-center">
          <div className="relative w-full flex items-center border-2 border-[#00a0ff] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#00a0ff]/20">
            <div className="pl-3 text-[#757575]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по объявлениям..."
              className="w-full bg-white py-2 px-2 text-sm text-[#222222] placeholder-[#757575] focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#00a0ff] hover:bg-[#0088d6] text-white px-5 py-2 font-extrabold text-sm flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <span>Найти</span>
            </button>
          </div>
        </form>

        {/* Admin Dashboard Button */}
        <button
          onClick={() => onChangeView('admin')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border shrink-0 cursor-pointer ${
            activeView === 'admin'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Админка ИИ</span>
        </button>

        {/* Current User Profile Display with Account Switcher Dropdown */}
        <div className="relative shrink-0 border-l border-[#e5e7eb] pl-3" ref={dropdownRef}>
          {currentProfile ? (
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl hover:bg-[#f2f4f7] transition-all group focus:outline-none cursor-pointer"
            >
              <img
                src={currentProfile.avatar_url}
                alt={currentProfile.full_name}
                className="w-9 h-9 rounded-full object-cover border border-[#d0d4dc]"
              />
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-extrabold text-[#222222] group-hover:text-[#00a0ff] transition-colors">
                  {currentProfile.full_name}
                </div>
                <div className="text-[10px] text-[#00aa5b] font-bold">
                  {currentProfile.user_type}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#757575] transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-[#00a0ff]' : 'group-hover:text-[#00a0ff]'
                }`}
              />
            </button>
          ) : (
            <div className="flex items-center gap-2 p-1.5 text-xs text-[#757575]">
              <User className="w-5 h-5" />
              <span>Профиль</span>
            </div>
          )}

          {/* Account Switching Dropdown Menu */}
          {isDropdownOpen && profiles.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#e3e5e8] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-1.5 border-b border-[#f0f1f3] text-[11px] font-bold text-[#757575] uppercase tracking-wider">
                Сменить аккаунт
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {profiles.map((p) => {
                  const isSelected = p.id === selectedProfileId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProfile(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-[#f2f4f7] cursor-pointer ${
                        isSelected ? 'bg-[#f0f7ff]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatar_url}
                          alt={p.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-[#d0d4dc]"
                        />
                        <div className="leading-tight">
                          <div className={`font-bold ${isSelected ? 'text-[#00a0ff]' : 'text-[#222222]'}`}>
                            {p.full_name}
                          </div>
                          <div className="text-[10px] text-[#757575]">
                            {p.user_type}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00a0ff] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avito Secondary Header / Categories Navigation */}
      <div className="bg-[#f8f9fa] border-t border-[#e5e7eb] px-4 py-2.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-bold text-[#222222] whitespace-nowrap">
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Авто</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Недвижимость</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Работа</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Услуги</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Товары</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Мои объявления</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors font-extrabold text-[#00a0ff]">Бизнес 360</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Жильё посуточно</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Запчасти</span>
          <span className="hover:text-[#00a0ff] cursor-pointer transition-colors">Электроника</span>
        </div>
      </div>
    </header>
  );
};

