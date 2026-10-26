/**
 * Language Execution Drivers for Method-Based Coding Problems.
 * Seamlessly hooks candidate's `class Solution` methods to standard input/output test cases.
 */

export interface DriverSpec {
  java?: string;
  python?: string;
  cpp?: string;
}

export const PROBLEM_DRIVERS: Record<string, DriverSpec> = {
  "two-sum": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();
        
        Solution sol = new Solution();
        int[] res = sol.twoSum(nums, target);
        if (res != null && res.length >= 2) {
            System.out.println(res[0] + " " + res[1]);
        }
    }
}
`,
    python: `
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        nums = list(map(int, lines[0].strip().split()))
        target = int(lines[1].strip())
        sol = Solution()
        fn = getattr(sol, 'twoSum', None) or getattr(sol, 'two_sum', None)
        if fn:
            res = fn(nums, target)
            if res is not None:
                print(f"{res[0]} {res[1]}")
`,
    cpp: `
int main() {
    string line;
    if (getline(cin, line)) {
        stringstream ss(line);
        vector<int> nums;
        int n;
        while (ss >> n) nums.push_back(n);
        int target;
        if (cin >> target) {
            Solution sol;
            auto res = sol.twoSum(nums, target);
            if (res.size() >= 2) {
                cout << res[0] << " " << res[1] << endl;
            }
        }
    }
    return 0;
}
`
  },

  "valid-palindrome": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        Solution sol = new Solution();
        System.out.println(sol.isPalindrome(s));
    }
}
`,
    python: `
if __name__ == '__main__':
    s = sys.stdin.readline().rstrip('\\r\\n')
    sol = Solution()
    fn = getattr(sol, 'isPalindrome', None) or getattr(sol, 'is_palindrome', None)
    if fn:
        print("true" if fn(s) else "false")
`,
    cpp: `
int main() {
    string s;
    if (getline(cin, s)) {
        Solution sol;
        cout << (sol.isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}
`
  },

  "valid-parentheses": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNext() ? sc.next() : "";
        Solution sol = new Solution();
        System.out.println(sol.isValid(s));
    }
}
`,
    python: `
if __name__ == '__main__':
    s = sys.stdin.read().strip()
    sol = Solution()
    fn = getattr(sol, 'isValid', None) or getattr(sol, 'is_valid', None)
    if fn:
        print("true" if fn(s) else "false")
`,
    cpp: `
int main() {
    string s;
    if (cin >> s) {
        Solution sol;
        cout << (sol.isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`
  },

  "best-time-to-buy-and-sell-stock": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] prices = new int[parts.length];
        for (int i = 0; i < parts.length; i++) prices[i] = Integer.parseInt(parts[i]);
        Solution sol = new Solution();
        System.out.println(sol.maxProfit(prices));
    }
}
`,
    python: `
if __name__ == '__main__':
    line = sys.stdin.read().strip()
    if line:
        prices = list(map(int, line.split()))
        sol = Solution()
        fn = getattr(sol, 'maxProfit', None) or getattr(sol, 'max_profit', None)
        if fn:
            print(fn(prices))
`,
    cpp: `
int main() {
    string line;
    if (getline(cin, line)) {
        stringstream ss(line);
        vector<int> prices;
        int p;
        while (ss >> p) prices.push_back(p);
        Solution sol;
        cout << sol.maxProfit(prices) << endl;
    }
    return 0;
}
`
  },

  "binary-search": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();
        Solution sol = new Solution();
        System.out.println(sol.search(nums, target));
    }
}
`,
    python: `
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        nums = list(map(int, lines[0].strip().split()))
        target = int(lines[1].strip())
        sol = Solution()
        fn = getattr(sol, 'search', None)
        if fn:
            print(fn(nums, target))
`,
    cpp: `
int main() {
    string line;
    if (getline(cin, line)) {
        stringstream ss(line);
        vector<int> nums;
        int n;
        while (ss >> n) nums.push_back(n);
        int target;
        if (cin >> target) {
            Solution sol;
            cout << sol.search(nums, target) << endl;
        }
    }
    return 0;
}
`
  },

  "longest-substring-without-repeating-characters": {
    java: `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        Solution sol = new Solution();
        System.out.println(sol.lengthOfLongestSubstring(s));
    }
}
`,
    python: `
if __name__ == '__main__':
    s = sys.stdin.read().rstrip('\\r\\n')
    sol = Solution()
    fn = getattr(sol, 'lengthOfLongestSubstring', None) or getattr(sol, 'length_of_longest_substring', None)
    if fn:
        print(fn(s))
`,
    cpp: `
int main() {
    string s;
    if (getline(cin, s)) {
        Solution sol;
        cout << sol.lengthOfLongestSubstring(s) << endl;
    }
    return 0;
}
`
  }
};

/**
 * Universal dynamic driver for any class Solution method.
 * Discovers and invokes the candidate's method with stdin tokens.
 */
export function getUniversalDriverJava(): string {
  return `
public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        
        java.lang.reflect.Method[] methods = Solution.class.getDeclaredMethods();
        java.lang.reflect.Method target = null;
        for (java.lang.reflect.Method m : methods) {
            if (!m.getName().equals("main") && !m.getName().startsWith("$")) {
                target = m;
                break;
            }
        }
        if (target == null) return;
        target.setAccessible(true);
        Class<?>[] pTypes = target.getParameterTypes();
        Object[] invokeArgs = new Object[pTypes.length];
        
        for (int i = 0; i < pTypes.length; i++) {
            Class<?> pt = pTypes[i];
            if (pt == int[].class) {
                if (sc.hasNextLine()) {
                    String line = sc.nextLine().trim();
                    if (!line.isEmpty()) {
                        String[] parts = line.split("\\\\s+");
                        int[] arr = new int[parts.length];
                        for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j]);
                        invokeArgs[i] = arr;
                    } else {
                        invokeArgs[i] = new int[0];
                    }
                }
            } else if (pt == int.class || pt == Integer.class) {
                if (sc.hasNextInt()) invokeArgs[i] = sc.nextInt();
                else if (sc.hasNext()) invokeArgs[i] = Integer.parseInt(sc.next());
            } else if (pt == String.class) {
                invokeArgs[i] = sc.hasNextLine() ? sc.nextLine().trim() : (sc.hasNext() ? sc.next() : "");
            } else if (pt == boolean.class || pt == Boolean.class) {
                invokeArgs[i] = sc.hasNextBoolean() ? sc.nextBoolean() : false;
            } else {
                invokeArgs[i] = null;
            }
        }
        
        Object res = target.invoke(sol, invokeArgs);
        if (res == null) return;
        if (res instanceof int[]) {
            int[] arr = (int[]) res;
            StringBuilder sb = new StringBuilder();
            for (int k = 0; k < arr.length; k++) {
                if (k > 0) sb.append(" ");
                sb.append(arr[k]);
            }
            System.out.println(sb.toString());
        } else {
            System.out.println(res.toString());
        }
    }
}
`;
}

export function getUniversalDriverPython(): string {
  return `
if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    sol = Solution()
    callables = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if callables:
        fn = getattr(sol, callables[0])
        import inspect
        sig = inspect.signature(fn)
        params = list(sig.parameters.values())
        args = []
        for i, p in enumerate(params):
            if i < len(lines):
                line = lines[i].strip()
                try:
                    if " " in line:
                        args.append([int(x) for x in line.split()])
                    elif line.isdigit() or (line.startswith('-') and line[1:].isdigit()):
                        args.append(int(line))
                    else:
                        args.append(line)
                except Exception:
                    args.append(line)
        res = fn(*args) if args else fn()
        if res is not None:
            if isinstance(res, list):
                print(" ".join(map(str, res)))
            elif isinstance(res, bool):
                print("true" if res else "false")
            else:
                print(res)
`;
}
