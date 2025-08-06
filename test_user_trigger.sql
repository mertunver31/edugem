-- =====================================================
-- TEST USER PROFILE TRIGGER
-- =====================================================
-- Bu dosya user profile trigger'ının çalışıp çalışmadığını test eder

-- Önce trigger'ın var olup olmadığını kontrol et
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Fonksiyonun var olup olmadığını kontrol et
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Mevcut kullanıcı sayısını kontrol et
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
    'public.users' as table_name,
    COUNT(*) as user_count
FROM public.users;

-- Trigger'ı yeniden oluştur (eğer çalışmıyorsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log mesajı
SELECT 'User profile trigger test completed' as status; 