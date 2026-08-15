-- V17__seed_python_course.sql
-- Demo certification course: "Python Programming Fundamentals"
-- 4 sections · 52 questions · active & community-visible.
-- Fixed UUIDs for org, user, course and sections so the seed is re-runnable
-- on a clean DB without orphaned rows.

DO $$
DECLARE
  v_org_id    uuid := 'a0000000-0000-4000-8000-000000000001';
  v_user_id   uuid := 'b0000000-0000-4000-8000-000000000001';
  v_course_id uuid := 'c0000000-0000-4000-8000-000000000001';

  v_sec1_id   uuid := 'd0000000-0000-4000-8000-000000000001';
  v_sec2_id   uuid := 'd0000000-0000-4000-8000-000000000002';
  v_sec3_id   uuid := 'd0000000-0000-4000-8000-000000000003';
  v_sec4_id   uuid := 'd0000000-0000-4000-8000-000000000004';

  v_q uuid;
BEGIN

  -- ── Org & user ─────────────────────────────────────────────────────────────

  INSERT INTO organizations (id, name, slug)
  VALUES (v_org_id, 'ELOVATE Demo', 'elovate-demo')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO users (id, organization_id, email, full_name)
  VALUES (v_user_id, v_org_id, 'seed-educator@elovate.demo', 'Seed Educator')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_roles (user_id, role_id)
  SELECT v_user_id, role_id FROM roles WHERE role_name = 'educator'
  ON CONFLICT DO NOTHING;

  -- ── Course ─────────────────────────────────────────────────────────────────
  -- course_visibility_id 2 = community · course_status_id 1 = active

  INSERT INTO courses (id, owning_organization_id, title, description,
    course_visibility_id, course_status_id, created_by)
  VALUES (
    v_course_id, v_org_id,
    'Python Programming Fundamentals',
    'A hands-on introduction to Python covering variables, control flow, functions, '
    'and object-oriented programming. Suitable for absolute beginners aiming to '
    'pass a foundational Python certification.',
    2, 1, v_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Sections ───────────────────────────────────────────────────────────────

  INSERT INTO course_sections (id, course_id, title, position) VALUES
    (v_sec1_id, v_course_id, 'Variables & Data Types',       1),
    (v_sec2_id, v_course_id, 'Control Flow',                 2),
    (v_sec3_id, v_course_id, 'Functions',                    3),
    (v_sec4_id, v_course_id, 'Object-Oriented Programming',  4)
  ON CONFLICT (id) DO NOTHING;

  -- ── Section content ─────────────────────────────────────────────────────────
  -- content_type_id 1 = text · 2 = code

  INSERT INTO course_section_content (course_section_id, body_text, content_type_id, position) VALUES
  (v_sec1_id,
   E'A variable is a named storage location. Python infers the type from the assigned value — no declaration needed.\n\nCore built-in types:\n• **int** – whole numbers: `42`, `-7`\n• **float** – decimals: `3.14`\n• **str** – text: `"hello"`\n• **bool** – `True` or `False`\n• **list** – ordered, mutable: `[1, 2, 3]`\n• **tuple** – ordered, immutable: `(1, 2, 3)`\n• **dict** – key–value pairs: `{"name": "Alice"}`\n• **NoneType** – the absence of a value: `None`\n\nUse `type()` to inspect the type of any value at runtime.',
   1, 1),
  (v_sec1_id,
   E'name = "Alice"\nage = 30\nheight = 1.75\nis_student = False\nscores = [95, 87, 92]\n\nprint(type(name))      # <class \'str\'>\nprint(type(age))       # <class \'int\'>\nprint(type(scores))    # <class \'list\'>',
   2, 2),
  (v_sec2_id,
   E'**if / elif / else** executes branches based on conditions.\n\n**for** loops iterate over any iterable (list, string, range, dict).\n\n**while** loops repeat while a condition is True.\n\n**break** exits a loop immediately. **continue** skips to the next iteration. **pass** is a no-op placeholder.',
   1, 1),
  (v_sec2_id,
   E'score = 78\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelse:\n    grade = "C"\n\nfor i in range(5):\n    if i == 3:\n        break\n    print(i)   # prints 0, 1, 2',
   2, 2),
  (v_sec3_id,
   E'A **function** is a reusable block of code defined with `def`.\n\n**Parameters** are inputs in the signature; **arguments** are the values passed at call time.\n\n`return` sends a value back to the caller. Without it the function returns `None`.\n\n**Default parameters** provide a fallback value and must come after non-default parameters.\n\nVariables defined inside a function are **local** — not visible outside.',
   1, 1),
  (v_sec3_id,
   E'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Alice"))        # Hello, Alice!\nprint(greet("Bob", "Hi")) # Hi, Bob!\n\ndef add(a, b):\n    return a + b\n\nresult = add(3, 4)   # 7',
   2, 2),
  (v_sec4_id,
   E'OOP organises code around **objects** — instances of **classes** that bundle data (attributes) and behaviour (methods).\n\nFour core principles:\n• **Encapsulation** – hide internal state; expose only what callers need.\n• **Inheritance** – a child class extends a parent, reusing and overriding behaviour.\n• **Polymorphism** – different classes respond to the same method call in their own way.\n• **Abstraction** – expose a simplified interface while hiding complexity.\n\n`__init__` is the constructor. `self` refers to the current instance and must be the first parameter of every instance method.',
   1, 1),
  (v_sec4_id,
   E'class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} makes a sound."\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} barks!"\n\nd = Dog("Rex")\nprint(d.speak())   # Rex barks!',
   2, 2);

  -- ══════════════════════════════════════════════════════════════════════════
  -- bloom_level_id:      1=Remember 2=Understand 3=Apply 4=Analyze 5=Evaluate 6=Create
  -- difficulty_level_id: 1=Easy     2=Medium     3=Hard  4=Expert
  -- base_difficulty:     0.3=Easy   0.5=Medium   0.7=Hard  0.9=Expert
  -- question_format_id:  1=mcq
  -- question_status_id:  1=active
  -- ══════════════════════════════════════════════════════════════════════════

  -- ╔═══════════════════════════════════╗
  -- ║  SECTION 1 – Variables & Data Types  (13 questions)
  -- ╚═══════════════════════════════════╝

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'What is the output of `type(42)` in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'<class ''int''>',true,0),(v_q,'<class ''float''>',false,1),(v_q,'<class ''str''>',false,2),(v_q,'<class ''num''>',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'What is the output of `type("hello")` in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'<class ''str''>',true,0),(v_q,'<class ''text''>',false,1),(v_q,'<class ''char''>',false,2),(v_q,'<class ''string''>',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'What is the type of the value `True` in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'bool',true,0),(v_q,'int',false,1),(v_q,'str',false,2),(v_q,'boolean',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'Which of the following represents the absence of a value in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'None',true,0),(v_q,'null',false,1),(v_q,'undefined',false,2),(v_q,'void',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'Which of the following is a **mutable** data type in Python?',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'list',true,0),(v_q,'tuple',false,1),(v_q,'str',false,2),(v_q,'int',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'Which statement best describes the difference between `int` and `float`?',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'int stores whole numbers; float stores numbers with a decimal point',true,0),
  (v_q,'float is faster than int',false,1),
  (v_q,'int can store decimals; float cannot',false,2),
  (v_q,'They are identical in Python',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'What does `len([1, 2, 3, 4])` return?',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'4',true,0),(v_q,'3',false,1),(v_q,'[1,2,3,4]',false,2),(v_q,'5',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,E'What is printed by the following code?\n\n```python\nx = 5\ny = 2\nprint(x ** y)\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'25',true,0),(v_q,'10',false,1),(v_q,'7',false,2),(v_q,'52',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,E'What is the value of `s` after:\n\n```python\ns = "Hello"\ns = s + " World"\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"Hello World"',true,0),(v_q,'"Hello"',false,1),(v_q,'It raises a TypeError',false,2),(v_q,'"HelloWorld"',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,E'What is the output of:\n\n```python\ncolors = ["red", "green", "blue"]\nprint(colors[-1])\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"blue"',true,0),(v_q,'"red"',false,1),(v_q,'IndexError',false,2),(v_q,'"green"',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'A developer writes `data = (1, 2, 3)` then tries `data[0] = 99`. What happens?',4,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'A TypeError is raised — tuples are immutable',true,0),
  (v_q,'The value is silently updated',false,1),
  (v_q,'An IndexError is raised',false,2),
  (v_q,'The tuple is automatically converted to a list',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,E'What is the value of `d["b"]` after:\n\n```python\nd = {"a": 1, "b": 2, "a": 3}\n```',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'2',true,0),(v_q,'1',false,1),(v_q,'Raises a KeyError',false,2),(v_q,'3',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec1_id,1,'Which variable name is **invalid** in Python?',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'2fast',true,0),(v_q,'fast_2',false,1),(v_q,'_fast',false,2),(v_q,'Fast2',false,3);

  -- ╔═══════════════════════════════════╗
  -- ║  SECTION 2 – Control Flow  (13 questions)
  -- ╚═══════════════════════════════════╝

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'Which keyword immediately exits a loop in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'break',true,0),(v_q,'continue',false,1),(v_q,'pass',false,2),(v_q,'exit',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'Which keyword skips the rest of the current loop iteration?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'continue',true,0),(v_q,'break',false,1),(v_q,'pass',false,2),(v_q,'skip',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'What is the purpose of `elif` in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'It checks an additional condition when the preceding if/elif was False',true,0),
  (v_q,'It defines an alternative loop',false,1),
  (v_q,'It is another spelling of else',false,2),
  (v_q,'It raises an exception if the condition fails',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'What does the `pass` statement do?',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Nothing — it is a syntactic placeholder',true,0),
  (v_q,'Pauses execution for one second',false,1),
  (v_q,'Exits the current function',false,2),
  (v_q,'Skips the current loop iteration',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'How many times does the following loop execute?\n\n```python\nfor i in range(2, 10, 3):\n    print(i)\n```',2,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'3',true,0),(v_q,'8',false,1),(v_q,'4',false,2),(v_q,'2',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'What is printed by this code?\n\n```python\nx = 10\nif x > 5 and x < 20:\n    print("in range")\nelse:\n    print("out of range")\n```',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"in range"',true,0),(v_q,'"out of range"',false,1),(v_q,'Nothing',false,2),(v_q,'True',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'Which code correctly prints only the even numbers from 2 to 10 inclusive?',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'for i in range(2, 11, 2): print(i)',true,0),
  (v_q,'for i in range(1, 10): if i % 2: print(i)',false,1),
  (v_q,'for i in range(0, 10, 2): print(i)',false,2),
  (v_q,'for i in range(2, 10): print(i)',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'What does this while loop print?\n\n```python\nn = 5\nwhile n > 0:\n    print(n)\n    n -= 2\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'5, 3, 1',true,0),(v_q,'5, 4, 3, 2, 1',false,1),(v_q,'5, 3',false,2),(v_q,'Infinite loop',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'What is printed?\n\n```python\nfor i in range(10):\n    if i == 5:\n        break\n    print(i)\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'0, 1, 2, 3, 4',true,0),(v_q,'0, 1, 2, 3, 4, 5',false,1),(v_q,'5',false,2),(v_q,'1, 2, 3, 4, 5',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'What is the final value of `total`?\n\n```python\ntotal = 0\nfor i in range(10):\n    if i % 2 == 0:\n        continue\n    total += i\n```',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'25',true,0),(v_q,'45',false,1),(v_q,'20',false,2),(v_q,'30',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'How many lines does this nested loop print?\n\n```python\nfor i in range(3):\n    for j in range(2):\n        print(i, j)\n```',4,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'6',true,0),(v_q,'5',false,1),(v_q,'3',false,2),(v_q,'9',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,'When should you prefer a `while` loop over a `for` loop?',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'When the number of iterations is not known in advance',true,0),
  (v_q,'When iterating over a list',false,1),
  (v_q,'When you need an index variable',false,2),
  (v_q,'while loops are always faster',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec2_id,1,E'Which of these loops is **infinite**?\n\n```python\n# A\nwhile True:\n    break\n\n# B\nwhile True:\n    pass\n\n# C\nfor i in range(0):\n    print(i)\n```',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'B',true,0),(v_q,'A',false,1),(v_q,'C',false,2),(v_q,'All three',false,3);

  -- ╔═══════════════════════════════════╗
  -- ║  SECTION 3 – Functions  (13 questions)
  -- ╚═══════════════════════════════════╝

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'Which keyword is used to define a function in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'def',true,0),(v_q,'function',false,1),(v_q,'fun',false,2),(v_q,'define',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'What value does a Python function return when it has no `return` statement?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'None',true,0),(v_q,'0',false,1),(v_q,'False',false,2),(v_q,'It raises a SyntaxError',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'What is a "parameter" in a Python function?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'A variable listed in the function definition that receives an argument value',true,0),
  (v_q,'The value passed when calling the function',false,1),
  (v_q,'The function''s return type',false,2),
  (v_q,'A global variable inside the function',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'What does the `return` statement do in a function?',2,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Sends a value back to the caller and exits the function',true,0),
  (v_q,'Prints a value to the console',false,1),
  (v_q,'Stores a value in a global variable',false,2),
  (v_q,'Pauses the function until called again',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'What is a default parameter?',2,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'A parameter with a fallback value used when the caller does not supply an argument',true,0),
  (v_q,'The first parameter in every function',false,1),
  (v_q,'A parameter that cannot be changed',false,2),
  (v_q,'A parameter that is always required',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,E'What does `greet("Alice")` return?\n\n```python\ndef greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n```',3,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"Hello, Alice!"',true,0),(v_q,'"Alice, Hello!"',false,1),(v_q,'"Hello Alice"',false,2),(v_q,'None',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,E'What is printed?\n\n```python\ndef add(a, b):\n    return a + b\n\nprint(add(b=4, a=3))\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'7',true,0),(v_q,'TypeError',false,1),(v_q,'34',false,2),(v_q,'43',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,E'What is the output?\n\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(4))\n```',3,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'24',true,0),(v_q,'12',false,1),(v_q,'16',false,2),(v_q,'Infinite recursion',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'Which function signature is **invalid** in Python?',4,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'def f(a, b=1, c): — non-default parameter follows a default parameter',true,0),
  (v_q,'def f(a, b, c=3): — default at the end',false,1),
  (v_q,'def f(a=1, b=2): — all defaults',false,2),
  (v_q,'def f(a, b, c): — no defaults at all',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,E'What is the value of `x` after this code?\n\n```python\nx = 10\n\ndef change():\n    x = 99\n\nchange()\n```',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'10 — local x inside change() does not affect the outer x',true,0),
  (v_q,'99 — the function updates the global x',false,1),
  (v_q,'A NameError is raised',false,2),
  (v_q,'None',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'What does `*args` allow in a function definition?',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Accepts any number of positional arguments as a tuple',true,0),
  (v_q,'Accepts any number of keyword arguments as a dict',false,1),
  (v_q,'Marks the argument as optional',false,2),
  (v_q,'Unpacks a list when calling the function',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,'When is it most appropriate to use a default parameter value?',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'When a sensible fallback exists and most callers do not need to override it',true,0),
  (v_q,'When the parameter value must always be provided',false,1),
  (v_q,'When you want to make the function private',false,2),
  (v_q,'When the function must return None',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec3_id,1,E'Which of the following will raise a `NameError`?\n\n```python\ndef f():\n    return value\n\nf()\n```',5,4,0.9,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'This code — `value` is not defined anywhere in scope',true,0),
  (v_q,'It returns None because value is not defined',false,1),
  (v_q,'It raises a TypeError',false,2),
  (v_q,'It raises a SyntaxError',false,3);

  -- ╔═══════════════════════════════════════════╗
  -- ║  SECTION 4 – Object-Oriented Programming  (13 questions)
  -- ╚═══════════════════════════════════════════╝

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'Which keyword defines a class in Python?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'class',true,0),(v_q,'object',false,1),(v_q,'type',false,2),(v_q,'struct',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'What is the purpose of `__init__` in a Python class?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'It is the constructor — called automatically when a new instance is created',true,0),
  (v_q,'It destroys the instance when it is no longer needed',false,1),
  (v_q,'It defines class-level variables only',false,2),
  (v_q,'It is called when the class itself is imported',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'What is the name given to a function defined inside a class?',1,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Method',true,0),(v_q,'Procedure',false,1),(v_q,'Subroutine',false,2),(v_q,'Constructor',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'What does `self` refer to inside an instance method?',2,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'The specific instance of the class on which the method was called',true,0),
  (v_q,'The class itself',false,1),
  (v_q,'A copy of the class',false,2),
  (v_q,'The parent class',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'What does it mean for a class to **inherit** from another class?',2,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'It receives the parent''s attributes and methods, which it can extend or override',true,0),
  (v_q,'It copies the source code of the parent class',false,1),
  (v_q,'It can only use methods defined in the parent — not override them',false,2),
  (v_q,'It replaces the parent class in memory',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,E'What does this code print?\n\n```python\nclass Dog:\n    def __init__(self, name):\n        self.name = name\n\nd = Dog("Rex")\nprint(d.name)\n```',3,1,0.3,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"Rex"',true,0),(v_q,'None',false,1),(v_q,'AttributeError',false,2),(v_q,'"name"',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,E'What is printed?\n\n```python\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} makes a sound."\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} barks!"\n\nd = Dog("Rex")\nprint(d.speak())\n```',3,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'"Rex barks!"',true,0),(v_q,'"Rex makes a sound."',false,1),(v_q,'AttributeError',false,2),(v_q,'None',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'A `Dog` class overrides `speak()` from `Animal`. When `speak()` is called on a `Dog` instance, the `Dog` version runs. Which OOP principle does this demonstrate?',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Polymorphism',true,0),(v_q,'Encapsulation',false,1),(v_q,'Abstraction',false,2),(v_q,'Overloading',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'Which OOP principle describes hiding an object''s internal state and only exposing a controlled interface?',4,2,0.5,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'Encapsulation',true,0),(v_q,'Inheritance',false,1),(v_q,'Polymorphism',false,2),(v_q,'Abstraction',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,E'What is the output of this code?\n\n```python\nclass Counter:\n    count = 0\n\n    def increment(self):\n        Counter.count += 1\n\na = Counter()\nb = Counter()\na.increment()\nb.increment()\nprint(Counter.count)\n```',4,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'2',true,0),(v_q,'1',false,1),(v_q,'0',false,2),(v_q,'AttributeError',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'When should you prefer **composition** over **inheritance**?',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'When the relationship is "has-a" rather than "is-a"',true,0),
  (v_q,'When you need to override a method',false,1),
  (v_q,'When the child class is identical to the parent',false,2),
  (v_q,'Composition and inheritance are always interchangeable',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,'What is the key benefit of encapsulation in OOP?',5,3,0.7,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'It protects internal state from unintended external modification, making code easier to maintain',true,0),
  (v_q,'It makes the class run faster',false,1),
  (v_q,'It prevents inheritance',false,2),
  (v_q,'It allows a function to have multiple return types',false,3);

  v_q := gen_random_uuid();
  INSERT INTO questions (id,course_section_id,question_format_id,prompt,bloom_level_id,difficulty_level_id,base_difficulty,created_by,question_status_id)
  VALUES(v_q,v_sec4_id,1,E'Which of the following is a **valid** Python class definition?\n\n```python\n# A\nClass MyClass:\n    pass\n\n# B\nclass MyClass:\n    pass\n\n# C\nclass MyClass\n    pass\n\n# D\ndef class MyClass():\n    pass\n```',6,4,0.9,v_user_id,1);
  INSERT INTO question_options(question_id,option_text,is_correct,position) VALUES
  (v_q,'B',true,0),(v_q,'A',false,1),(v_q,'C',false,2),(v_q,'D',false,3);

END $$;
